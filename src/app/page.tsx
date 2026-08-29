'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import MapContainer from '@/components/map/MapContainer';
import SearchBar from '@/components/search/SearchBar';
import ZoomControls from '@/components/map/ZoomControls';
import InstructionModal from '@/components/map/InstructionModal';
import PlaceDetails from '@/components/map/PlaceDetails';
import DirectionsPanel from '@/components/navigation/DirectionsPanel';
import FloatingNavCard from '@/components/navigation/FloatingNavCard';
import { useMapStore } from '@/stores/map-store';

import { LocationMarkerButton } from '@/components/map/LocationMarker';
import LocationConsentBanner from '@/components/map/LocationConsentBanner';
import VoiceAssistant from '@/components/voice/VoiceAssistant';

// Dynamic import for ThreeMap3D with SSR disabled
const ThreeMap3D = dynamic(() => import('@/components/map/ThreeMap3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-950 flex items-center justify-center text-white font-quicksand">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Loading 3D Campus Scene...</span>
      </div>
    </div>
  ),
});

function MapView() {
  const searchParams = useSearchParams();
  const { setPin, setZoomLevel, viewMode, theme } = useMapStore();

  useEffect(() => {
    const isPinned = searchParams.get('pin') === 'true';
    const level = searchParams.get('level');
    const left = searchParams.get('left');
    const top = searchParams.get('top');

    if (level) {
      const parsedLevel = parseInt(level, 10);
      if (parsedLevel >= 1 && parsedLevel <= 4) {
        setZoomLevel(parsedLevel);
      }
    }

    if (isPinned && left && top) {
      const x = parseInt(left, 10);
      const y = parseInt(top, 10);
      setPin(x, y);

      setTimeout(() => {
        const el = document.querySelector('.bg-map') as HTMLElement;
        if (el) {
          el.scrollTop = y - window.innerHeight / 2;
          el.scrollLeft = x - window.innerWidth / 2;
        }
      }, 200);
    }
  }, [searchParams, setPin, setZoomLevel]);

  return (
    <main
      className={`relative w-screen h-screen overflow-hidden select-none ${
        theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Search Header */}
      <SearchBar />

      {/* Location Permission First-Load Consent Banner */}
      <LocationConsentBanner />

      {/* Main Interactive Map (2D or 3D) */}
      {viewMode === '2d' ? <MapContainer /> : <ThreeMap3D />}

      {/* Navigation Directions Panel & Floating Turn-by-Turn Card */}
      <DirectionsPanel />
      <FloatingNavCard />

      {/* Zoom, Compass Rotation, Layer and Location Action Controls */}
      <ZoomControls />

      {/* Floating JARVIS Voice AI Assistant */}
      <VoiceAssistant />

      {/* Instruction Popup Modal (in 2D mode) */}
      {viewMode === '2d' && <InstructionModal />}

      {/* Bottom Sheet Place Details Panel */}
      <PlaceDetails />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-campus-bg flex items-center justify-center font-quicksand">
          Loading GeoBITs...
        </div>
      }
    >
      <MapView />
    </Suspense>
  );
}
