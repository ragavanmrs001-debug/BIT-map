'use client';

// Step conversion constant: average step length is ~0.75 meters
export const METERS_PER_STEP = 0.75;

export interface CampusLandmark {
  name: string;
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
    x: 1700,
    y: 1950,
    lat: 11.4945,
    lng: 77.2765,
    description: 'Central administrative quadrant and main academic building entrance.',
  },
  {
    name: 'Central Library',
    x: 1550,
    y: 1800,
    lat: 11.4950,
    lng: 77.2760,
    description: 'State-of-the-art campus central library.',
  },
  {
    name: 'Computer Science & IT Block',
    x: 1850,
    y: 2100,
    lat: 11.4940,
    lng: 77.2770,
    description: 'Department of Computer Science and Engineering & Information Technology.',
  },
  {
    name: 'Mechanical & Electrical Block',
    x: 1400,
    y: 2200,
    lat: 11.4935,
    lng: 77.2755,
    description: 'Department of Mechanical Engineering and Electrical Laboratories.',
  },
  {
    name: 'BIT Main Canteen & Food Court',
    x: 2100,
    y: 1750,
    lat: 11.4955,
    lng: 77.2780,
    description: 'Main student dining facility and refreshment center.',
  },
  {
    name: 'Student Hostel Complex',
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
      utterance.lang = 'en-US';

      // Pick standard smooth English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Alex'))
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
        
        const message = `Moving forward. In about ${steps} steps, you will reach ${landmark.name}.`;
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
    const stepsToCurrent = this.metersToSteps(distanceMeters);

    // Find a second nearby landmark for rich context
    const sorted = [...BIT_LANDMARKS]
      .map((lm) => ({
        landmark: lm,
        steps: this.metersToSteps(this.calculateDistance(lat, lng, lm.lat, lm.lng)),
      }))
      .sort((a, b) => a.steps - b.steps);

    const nearest = sorted[0];
    const secondNearest = sorted[1] || sorted[0];

    let commentary = '';
    if (nearest.steps < 20) {
      commentary = `You have been standing at ${nearest.landmark.name} for 60 seconds. `;
      if (secondNearest && secondNearest.steps > 0) {
        commentary += `You are ${secondNearest.steps} steps away from ${secondNearest.landmark.name}.`;
      }
    } else {
      commentary = `You have been standing in the BIT Campus area for 60 seconds. You are ${nearest.steps} steps from ${nearest.landmark.name}, and ${secondNearest.steps} steps from ${secondNearest.landmark.name}.`;
    }

    this.speak(commentary);
  }
}

export const globalVoiceTracker = new VoiceTrackerEngine();
