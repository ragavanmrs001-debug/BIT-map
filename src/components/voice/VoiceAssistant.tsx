import React, { useState, useEffect, useRef } from 'react';
import { useMapStore } from '@/stores/map-store';
import { useNavigationStore } from '@/stores/navigation-store';
import { zoomLevel4Tags } from '@/data/zoom-level-4';
import { MAX_ZOOM, MIN_ZOOM } from '@/lib/constants';
import { globalVoiceTracker } from '@/lib/voice-tracker';
import { findNearestRestroom } from '@/lib/restroom-service';

const NEXT_API_URL = '/api/voice/command';
const PYTHON_BACKEND_URL = 'http://localhost:8000/api/voice/command';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [voiceTrackerEnabled, setVoiceTrackerEnabled] = useState(true);

  const { selectPlace, setZoomLevel, toggleTheme, toggleLayer } = useMapStore();
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition API (English en-US)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript('Listening for command...');
        };

        recognition.onresult = async (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(`" ${text} "`);
          setIsListening(false);
          await handleProcessCommand(text);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setTranscript('Could not hear audio. Please try again.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setResponseMessage('');
      recognitionRef.current?.start();
    }
  };

  const toggleVoiceTracker = () => {
    const nextState = !voiceTrackerEnabled;
    setVoiceTrackerEnabled(nextState);
    globalVoiceTracker.setEnabled(nextState);
    if (nextState) {
      speakClientSide('Voice navigation guidance enabled.');
    } else {
      speakClientSide('Voice navigation muted.');
    }
  };

  const speakClientSide = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const executeMapCommand = (action: string, targetId?: string | null) => {
    const container = document.querySelector('.bg-map') as HTMLElement;

    if (action === 'nearest_restroom') {
      const currentX = container ? container.scrollLeft + window.innerWidth / 2 : 1700;
      const currentY = container ? container.scrollTop + window.innerHeight / 2 : 1950;
      const nearest = findNearestRestroom(currentX, currentY);

      if (nearest) {
        setZoomLevel(MAX_ZOOM);
        const setRoute = useNavigationStore.getState().setRoute;
        const setFrom = useNavigationStore.getState().setFrom;
        const setTo = useNavigationStore.getState().setTo;

        setFrom('main-gate');
        setTo(nearest.restroom.id);
        setRoute(
          nearest.route.path,
          nearest.route.nodePath.map((n) => ({ x: n.left, y: n.top })),
          nearest.route.steps,
          nearest.route.distance,
          nearest.route.startingPoint,
          nearest.route.endingPoint
        );

        if (container) {
          container.scrollTo({
            left: nearest.restroom.x - window.innerWidth / 2,
            top: nearest.restroom.y - window.innerHeight / 2,
            behavior: 'smooth',
          });
        }
        setTimeout(() => selectPlace(nearest.restroom.id), 300);
      }
    } else if (action === 'navigate' && targetId) {
      handleAutoNavigate(targetId);
    } else if (action === 'zoom_in') {
      setZoomLevel(MAX_ZOOM);
    } else if (action === 'zoom_out') {
      setZoomLevel(MIN_ZOOM);
    } else if (action === 'recenter') {
      if (container) {
        container.scrollTo({ top: 400, left: 200, behavior: 'smooth' });
      }
    } else if (action === 'toggle_dark') {
      toggleTheme();
    } else if (action === 'toggle_layer') {
      toggleLayer();
    }
  };

  const handleProcessCommand = async (commandText: string) => {
    try {
      // 1. Try Next.js native serverless API (Vercel compatible)
      let res = await fetch(NEXT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: commandText }),
      });

      if (!res.ok) {
        // Fallback to Python server if local API unready
        res = await fetch(PYTHON_BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: commandText }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        setResponseMessage(data.response_text);

        // Speak response out loud
        speakClientSide(data.response_text);

        // Simultaneously execute real-time map command
        if (data.action || data.target_place_id) {
          executeMapCommand(data.action || 'navigate', data.target_place_id);
        }
      } else {
        throw new Error('API offline');
      }
    } catch (err) {
      // Offline fallback: Client-side NLP matching
      console.warn('JARVIS API offline, executing client fallback:', err);
      const lower = commandText.toLowerCase();

      if (lower.includes('restroom') || lower.includes('toilet') || lower.includes('washroom')) {
        const reply = 'Locating the nearest restroom from your position, sir.';
        setResponseMessage(reply);
        speakClientSide(reply);
        executeMapCommand('nearest_restroom');
      } else {
        const tagMatch = zoomLevel4Tags.find((t) => lower.includes(t.name.toLowerCase()));
        if (tagMatch) {
          const reply = `Navigating to ${tagMatch.name}, sir.`;
          setResponseMessage(reply);
          speakClientSide(reply);
          executeMapCommand('navigate', tagMatch.id);
        } else {
          const reply = `I heard "${commandText}". Processing campus query.`;
          setResponseMessage(reply);
          speakClientSide(reply);
        }
      }
    }
  };

  const handleAutoNavigate = (placeId: string) => {
    const tag = zoomLevel4Tags.find((t) => t.id === placeId);
    setZoomLevel(MAX_ZOOM);

    const container = document.querySelector('.bg-map') as HTMLElement;
    if (container && tag) {
      const top = parseFloat(tag.top);
      const left = parseFloat(tag.left);
      container.scrollTo({
        left: left - window.innerWidth / 2,
        top: top - window.innerHeight / 2,
        behavior: 'smooth',
      });
    }

    setTimeout(() => {
      selectPlace(placeId);
    }, 400);
  };

  return (
    <>
      {/* Floating Glowing JARVIS Voice AI Trigger Orb */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="JARVIS Campus Voice AI"
        className={`fixed right-5 bottom-[335px] z-[150] w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border transition-all duration-300 ${isListening || isSpeaking
          ? 'bg-red-500 border-red-400 text-white animate-pulse shadow-red-500/50 scale-110'
          : 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/40 hover:scale-105'
          }`}
      >
        <span className="text-xl">🎙️</span>
      </button>

      {/* Voice Assistant Panel Modal */}
      {isOpen && (
        <div className="fixed right-5 bottom-[395px] z-[155] w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${isListening
                  ? 'bg-red-500 animate-ping'
                  : isSpeaking
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-indigo-500'
                  }`}
              />
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                JARVIS Campus Voice AI
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* English Voice AI Mode Indicator */}
          <div className="flex items-center justify-center py-1.5 px-3 mb-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300">
            🎙️ English JARVIS Voice Assistant Active
          </div>

          {/* Central Pulsing Mic Button */}
          <div className="flex flex-col items-center my-3">
            <button
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all duration-300 ${isListening
                ? 'bg-red-500 text-white ring-8 ring-red-500/20 animate-pulse scale-105'
                : isSpeaking
                  ? 'bg-emerald-500 text-white ring-8 ring-emerald-500/20 animate-bounce'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-indigo-600/30'
                }`}
            >
              🎤
            </button>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
              {isListening
                ? 'Listening...'
                : isSpeaking
                  ? 'JARVIS Speaking...'
                  : 'Tap microphone to speak'}
            </p>
          </div>

          {/* Voice Guidance / Step Guidance Toggle */}
          <div className="my-3 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="text-sm">🗣️</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Step & 60s Voice Alerts
              </span>
            </div>
            <button
              onClick={toggleVoiceTracker}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${voiceTrackerEnabled
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
            >
              {voiceTrackerEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Transcript Box */}
          {transcript && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl mb-3 text-xs text-slate-700 dark:text-slate-300 italic font-medium text-center">
              {transcript}
            </div>
          )}

          {/* Response Box */}
          {responseMessage && (
            <div className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 p-3 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 font-semibold text-center leading-relaxed">
              {responseMessage}
            </div>
          )}
        </div>
      )}
    </>
  );
}
