'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useMapStore } from '@/stores/map-store';
import { MAX_ZOOM, getMapDimensions } from '@/lib/constants';
import { globalVoiceTracker } from '@/lib/voice-tracker';

export interface GeoLocationPos {
  x: number;
  y: number;
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
}

// Convert GPS Lat/Lng to Base Level 4 Canvas Coordinates
export function gpsToCanvasCoords(lat: number, lng: number): { x: number; y: number } {
  // Reference point: Main Academic Quad (1700, 1950) at Lat 11.4945, Lng 77.2765
  const baseLat = 11.4945;
  const baseLng = 77.2765;
  const latScale = 85000;
  const lngScale = 85000;

  const x = 1700 + (lng - baseLng) * lngScale;
  const y = 1950 - (lat - baseLat) * latScale;

  return {
    x: Math.max(50, Math.min(3370, x)),
    y: Math.max(50, Math.min(3820, y)),
  };
}

// Custom hook for shared GPS location state
export function useGPSLocation() {
  const [userPos, setUserPos] = useState<GeoLocationPos | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const { x, y } = gpsToCanvasCoords(lat, lng);

          setUserPos({
            x,
            y,
            lat,
            lng,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
          });

          // Feed position to voice tracker engine for step & 60s idle voice guidance
          globalVoiceTracker.updatePosition(lat, lng);
        },
        (err) => {
          console.warn('GPS location update error:', err.message);
          setErrorMsg(err.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  return { userPos, errorMsg };
}

// Canvas-bound Blue Dot Location Marker (Rendered inside MapContainer canvas)
export function LocationMarkerCanvas() {
  const { userPos } = useGPSLocation();
  const { zoomLevel } = useMapStore();

  if (!userPos) return null;

  // Scale position relative to current zoom level if canvas dimensions shrink
  const scale = Math.pow(1 / 1.5, MAX_ZOOM - zoomLevel);
  const posX = userPos.x * scale;
  const posY = userPos.y * scale;

  return (
    <div
      className="absolute z-[130] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
      style={{ top: `${posY}px`, left: `${posX}px` }}
    >
      {/* Outer Pulse Accuracy Ring */}
      <div
        className="w-10 h-10 rounded-full bg-blue-500/25 animate-ping absolute -inset-1"
        style={{ transform: `scale(${Math.min(2.5, Math.max(1, userPos.accuracy / 15))})` }}
      />
      {/* Inner Accuracy Radius Halo */}
      <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/40 absolute -inset-0.5" />

      {/* Core Glowing Blue Dot */}
      <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-xl relative flex items-center justify-center">
        {userPos.heading !== null && (
          <div
            className="w-1 h-3.5 bg-white rounded-full absolute -top-1.5 shadow-sm"
            style={{ transform: `rotate(${userPos.heading}deg)` }}
          />
        )}
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
      </div>
    </div>
  );
}

// Floating UI Button for Locate Me action
export function LocationMarkerButton() {
  const [isLocating, setIsLocating] = useState(false);
  const { setZoomLevel } = useMapStore();

  const handleLocateMe = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const { x, y } = gpsToCanvasCoords(lat, lng);

          setZoomLevel(MAX_ZOOM);

          setTimeout(() => {
            const container = document.querySelector('.bg-map') as HTMLElement;
            if (container) {
              container.scrollTo({
                left: x - window.innerWidth / 2,
                top: y - window.innerHeight / 2,
                behavior: 'smooth',
              });
            }
          }, 100);

          globalVoiceTracker.updatePosition(lat, lng);
          setIsLocating(false);
        },
        (err) => {
          alert('GPS location unavailable or permission denied. Please allow location access in your browser settings.');
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  };

  return (
    <button
      onClick={handleLocateMe}
      title="Locate My Position (GPS)"
      className={`w-11 h-11 rounded-xl backdrop-blur-md border shadow-lg flex items-center justify-center font-bold text-lg transition-all ${isLocating
        ? 'bg-blue-600 border-blue-500 text-white animate-spin'
        : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
        }`}
    >
      🎯
    </button>
  );
}

export default LocationMarkerCanvas;
