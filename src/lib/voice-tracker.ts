'use client';

// Step conversion constant: average step length is ~0.75 meters
export const METERS_PER_STEP = 0.75;

export interface CampusLandmark {
  name: string;
  nameTa?: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  description: string;
}

// Key BIT Erode Campus Landmarks (Map Canvas coordinates & GPS estimates)
export const BIT_LANDMARKS: CampusLandmark[] = [
  {
    name: 'Main Academic Quad / Admin Block',
    nameTa: 'முதன்மை நிர்வாக தொகுதி',
    x: 1700,
    y: 1950,
    lat: 11.4945,
    lng: 77.2765,
    description: 'Central administrative quadrant and main academic building entrance.',
  },
  {
    name: 'Central Library',
    nameTa: 'மத்திய நூலகம்',
    x: 1550,
    y: 1800,
    lat: 11.4950,
    lng: 77.2760,
    description: 'State-of-the-art campus central library.',
  },
  {
    name: 'Computer Science & IT Block',
    nameTa: 'கணினி அறிவியல் மற்றும் தகவல் தொழில்நுட்ப கட்டிடம்',
    x: 1850,
    y: 2100,
    lat: 11.4940,
    lng: 77.2770,
    description: 'Department of Computer Science and Engineering & Information Technology.',
  },
  {
    name: 'Mechanical & Electrical Block',
    nameTa: 'இயந்திரவியல் மற்றும் மின்சாரவியல் பிரிவு',
    x: 1400,
    y: 2200,
    lat: 11.4935,
    lng: 77.2755,
    description: 'Department of Mechanical Engineering and Electrical Laboratories.',
  },
  {
    name: 'BIT Main Canteen & Food Court',
    nameTa: 'பி.ஐ.டி உணவகம்',
    x: 2100,
    y: 1750,
    lat: 11.4955,
    lng: 77.2780,
    description: 'Main student dining facility and refreshment center.',
  },
  {
    name: 'Student Hostel Complex',
    nameTa: 'மாணவர் விடுதி வளாகம்',
    x: 2300,
    y: 1400,
    lat: 11.4965,
    lng: 77.2790,
    description: 'BIT Hostel Residential Quadrangle.',
  },
];

export class VoiceTrackerEngine {
  private lastLat: number | null = null;
  private lastLng: number | null = null;
  private lastMovedTime: number = Date.now();
  private stationaryTimer: NodeJS.Timeout | null = null;
  private hasAnnouncedFirstStep = false;
  private lastStationaryAnnouncementTime = 0;
  private enabled = true;
  private language: 'en-US' | 'ta-IN' = 'en-US';

  constructor() {}

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.clearStationaryTimer();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setLanguage(lang: 'en-US' | 'ta-IN') {
    this.language = lang;
  }

  public getLanguage(): 'en-US' | 'ta-IN' {
    return this.language;
  }

  // Calculate distance in meters using Haversine formula
  public calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Convert distance in meters to step count
  public metersToSteps(meters: number): number {
    return Math.max(1, Math.round(meters / METERS_PER_STEP));
  }

  // Find nearest BIT landmark to current lat/lng
  public getNearestLandmark(lat: number, lng: number): { landmark: CampusLandmark; distanceMeters: number } {
    let minDistance = Infinity;
    let nearest = BIT_LANDMARKS[0];

    for (const lm of BIT_LANDMARKS) {
      const dist = this.calculateDistance(lat, lng, lm.lat, lm.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = lm;
      }
    }

    return { landmark: nearest, distanceMeters: minDistance };
  }

  // Voice synthesis speaker
  public speak(text: string) {
    if (!this.enabled) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Smooth natural pacing
      utterance.pitch = 1.0;
      utterance.lang = this.language;

      // Pick smooth voice matching current language
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith(this.language.slice(0, 2))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }

  // Update user GPS location and check movement/stationary state
  public updatePosition(lat: number, lng: number) {
    if (!this.enabled) return;

    const now = Date.now();

    if (this.lastLat === null || this.lastLng === null) {
      this.lastLat = lat;
      this.lastLng = lng;
      this.lastMovedTime = now;
      this.startStationaryTimer(lat, lng);
      return;
    }

    const moveDistance = this.calculateDistance(this.lastLat, this.lastLng, lat, lng);

    // If user moved more than 2.5 meters -> Movement detected
    if (moveDistance > 2.5) {
      this.lastMovedTime = now;
      this.lastLat = lat;
      this.lastLng = lng;

      // Reset stationary timer
      this.startStationaryTimer(lat, lng);

      // Speak First Step Guidance if not announced recently
      if (!this.hasAnnouncedFirstStep) {
        this.hasAnnouncedFirstStep = true;
        const { landmark, distanceMeters } = this.getNearestLandmark(lat, lng);
        const steps = this.metersToSteps(distanceMeters);
        
        const landmarkName = this.language === 'ta-IN' && landmark.nameTa ? landmark.nameTa : landmark.name;
        const message = this.language === 'ta-IN'
          ? `முன்னோக்கி செல்லவும். ${steps} அடிகளில் ${landmarkName} வந்துவிடுவீர்கள்.`
          : `Moving forward. In about ${steps} steps, you will reach ${landmarkName}.`;

        this.speak(message);

        // Reset first step announcement flag after 30 seconds of walking
        setTimeout(() => {
          this.hasAnnouncedFirstStep = false;
        }, 30000);
      }
    }
  }

  // Start 60-second stationary idle timer
  private startStationaryTimer(lat: number, lng: number) {
    this.clearStationaryTimer();

    this.stationaryTimer = setTimeout(() => {
      const now = Date.now();
      // Ensure 60 seconds have passed since last announcement
      if (now - this.lastStationaryAnnouncementTime >= 55000) {
        this.lastStationaryAnnouncementTime = now;
        this.announceStationaryLocation(lat, lng);
      }
    }, 60000); // 60 Seconds Idle
  }

  private clearStationaryTimer() {
    if (this.stationaryTimer) {
      clearTimeout(this.stationaryTimer);
      this.stationaryTimer = null;
    }
  }

  // Announce stationary location and steps to surrounding BIT landmarks
  private announceStationaryLocation(lat: number, lng: number) {
    const { landmark, distanceMeters } = this.getNearestLandmark(lat, lng);

    const sorted = [...BIT_LANDMARKS]
      .map((lm) => ({
        landmark: lm,
        steps: this.metersToSteps(this.calculateDistance(lat, lng, lm.lat, lm.lng)),
      }))
      .sort((a, b) => a.steps - b.steps);

    const nearest = sorted[0];
    const secondNearest = sorted[1] || sorted[0];

    const nName = this.language === 'ta-IN' && nearest.landmark.nameTa ? nearest.landmark.nameTa : nearest.landmark.name;
    const snName = this.language === 'ta-IN' && secondNearest.landmark.nameTa ? secondNearest.landmark.nameTa : secondNearest.landmark.name;

    let commentary = '';
    if (this.language === 'ta-IN') {
      if (nearest.steps < 20) {
        commentary = `நீங்கள் 60 வினாடிகளாக ${nName} அருகில் நிற்கிறீர்கள். ${snName} நோக்கி ${secondNearest.steps} அடிகள் உள்ளன.`;
      } else {
        commentary = `நீங்கள் 60 வினாடிகளாக இங்கு நிற்கிறீர்கள். ${nName} நோக்கி ${nearest.steps} அடிகளும், ${snName} நோக்கி ${secondNearest.steps} அடிகளும் உள்ளன.`;
      }
    } else {
      if (nearest.steps < 20) {
        commentary = `You have been standing at ${nName} for 60 seconds. You are ${secondNearest.steps} steps away from ${snName}.`;
      } else {
        commentary = `You have been standing in the BIT Campus area for 60 seconds. You are ${nearest.steps} steps from ${nName}, and ${secondNearest.steps} steps from ${snName}.`;
      }
    }

    this.speak(commentary);
  }
}

export const globalVoiceTracker = new VoiceTrackerEngine();
