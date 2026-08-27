'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMapStore } from '@/stores/map-store';
import { zoomLevel4Tags } from '@/data/zoom-level-4';
import { MAX_ZOOM } from '@/lib/constants';
import { globalVoiceTracker } from '@/lib/voice-tracker';

const BACKEND_URL = 'http://localhost:8000/api/voice/command';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [voiceTrackerEnabled, setVoiceTrackerEnabled] = useState(true);
  const [language, setLanguage] = useState<'en-US' | 'ta-IN'>('en-US');

  const { selectPlace, setZoomLevel } = useMapStore();
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language;

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript(language === 'ta-IN' ? 'கேட்கிறது...' : 'Listening for command...');
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
          setTranscript(language === 'ta-IN' ? 'ஒலி கேட்கவில்லை. மீண்டும் முயலவும்.' : 'Could not hear audio. Please try again.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setResponseMessage('');
      recognitionRef.current?.start();
    }
  };

  const handleLanguageChange = (newLang: 'en-US' | 'ta-IN') => {
    setLanguage(newLang);
    globalVoiceTracker.setLanguage(newLang);
    const msg = newLang === 'ta-IN' ? 'தமிழ் குரல் முறை இயக்கப்பட்டன.' : 'English voice assistant activated.';
    speakClientSide(msg);
  };

  const toggleVoiceTracker = () => {
    const nextState = !voiceTrackerEnabled;
    setVoiceTrackerEnabled(nextState);
    globalVoiceTracker.setEnabled(nextState);
    if (nextState) {
      speakClientSide(language === 'ta-IN' ? 'குரல் வழிகாட்டுதல் இயக்கப்பட்டது.' : 'Voice navigation guidance enabled.');
    } else {
      speakClientSide(language === 'ta-IN' ? 'குரல் வழிகாட்டுதல் முடக்கப்பட்டது.' : 'Voice navigation muted.');
    }
  };

  const speakClientSide = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = language;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleProcessCommand = async (commandText: string) => {
    try {
      // 1. Call Python JARVIS FastAPI Server
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: commandText, lang: language }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponseMessage(data.response_text);

        // Auto-navigate map if building is returned
        if (data.target_place_id) {
          handleAutoNavigate(data.target_place_id);
        }

        // Play Python JARVIS Audio response if available
        if (data.audio_base64) {
          const audio = new Audio(data.audio_base64);
          audio.onplay = () => setIsSpeaking(true);
          audio.onended = () => setIsSpeaking(false);
          audio.play().catch(() => speakClientSide(data.response_text));
        } else {
          speakClientSide(data.response_text);
        }
      } else {
        throw new Error('Backend offline');
      }
    } catch (err) {
      // Offline fallback: Process locally
      console.warn('JARVIS Backend API offline, using browser fallback:', err);
      const lower = commandText.toLowerCase();

      // Check campus keywords locally
      const tagMatch = zoomLevel4Tags.find((t) => lower.includes(t.name.toLowerCase()));
      if (tagMatch) {
        const reply = language === 'ta-IN' ? `${tagMatch.name} பகுதிக்கு வழிகாட்டப்படுகிறது.` : `Navigating to ${tagMatch.name}, sir.`;
        setResponseMessage(reply);
        speakClientSide(reply);
        handleAutoNavigate(tagMatch.id);
      } else {
        const reply = language === 'ta-IN' ? `நான் கேட்டது: ${commandText}` : `I heard: ${commandText}. Operating in browser voice mode.`;
        setResponseMessage(reply);
        speakClientSide(reply);
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
        className={`fixed right-5 bottom-24 z-[150] w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border transition-all duration-300 ${
          isListening || isSpeaking
            ? 'bg-red-500 border-red-400 text-white animate-pulse shadow-red-500/50 scale-110'
            : 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/40 hover:scale-105'
        }`}
      >
        <span className="text-xl">🎙️</span>
      </button>

      {/* Voice Assistant Panel Modal */}
      {isOpen && (
        <div className="fixed right-5 bottom-40 z-[150] w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isListening
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

          {/* Bilingual Language Selector */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => handleLanguageChange('en-US')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                language === 'en-US'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              🇺🇸 English
            </button>
            <button
              onClick={() => handleLanguageChange('ta-IN')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                language === 'ta-IN'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              🇮🇳 தமிழ் (Tamil)
            </button>
          </div>

          {/* Central Pulsing Mic Button */}
          <div className="flex flex-col items-center my-3">
            <button
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all duration-300 ${
                isListening
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
                ? language === 'ta-IN' ? 'கேட்கிறது...' : 'Listening...'
                : isSpeaking
                ? 'JARVIS Speaking...'
                : language === 'ta-IN' ? 'பேச மைக் தொடுங்கள்' : 'Tap microphone to speak'}
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
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                voiceTrackerEnabled
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
