'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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

// Convert GPS Lat/Lng to Base Level 4 Canvas Coordinates for BIT Sathyamangalam (Erode) Campus
export function gpsToCanvasCoords(lat: number, lng: number): { x: number; y: number } {
  // Reference Center: Main Academic Quad (X: 1700, Y: 1950) at Lat 11.4986° N, Lng 77.2743° E
  // 0.29 meters per pixel canvas scale
  const baseLat = 11.4986;
  const baseLng = 77.2743;
  const latScale = 383237.93;
  const lngScale = 375557.50;

  const x = 1700 + (lng - baseLng) * lngScale;
  const y = 1950 - (lat - baseLat) * latScale;

  return {
    x: Math.max(50, Math.min(3370, x)),
    y: Math.max(50, Math.min(3820, y)),
  };
}

// Custom hook for shared GPS location state with device compass orientation support
export function useGPSLocation() {
  const [userPos, setUserPos] = useState<GeoLocationPos | null>(null);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const compassHeadingRef = useRef<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Device orientation / magnetometer compass heading sensor
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;
      const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof webkitHeading === 'number') {
        heading = webkitHeading;
      } else if (e.alpha !== null) {
        heading = 360 - e.alpha;
      }
      if (heading !== null) {
        const rounded = Math.round(heading);
        compassHeadingRef.current = rounded;
        setCompassHeading(rounded);
      }
    };

    const win = window as unknown as Record<string, unknown>;
    if ('ondeviceorientationabsolute' in win) {
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    } else {
      window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
    };
  }, []);

  // Isolate GPS watchPosition from compass heading state updates to avoid teardown churn
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const { x, y } = gpsToCanvasCoords(lat, lng);
          const heading = pos.coords.heading !== null ? pos.coords.heading : compassHeadingRef.current;

          const locationData: GeoLocationPos = {
            x,
            y,
            lat,
            lng,
            accuracy: pos.coords.accuracy,
            heading,
          };

          setUserPos(locationData);

          // Sync to global map store for navigation calculation and 3D mode
          useMapStore.getState().setUserCanvasPos({ x, y });
          useMapStore.getState().setUserGeoPos(locationData);

          // Feed position to voice tracker engine for step & idle voice guidance
          globalVoiceTracker.updatePosition(lat, lng);
        },
        (err) => {
          console.warn('GPS location update error:', err.message);
          setErrorMsg(err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  return { userPos, compassHeading, errorMsg };
}

// Canvas-bound Blue Dot Location Marker (Rendered inside MapContainer canvas)
export function LocationMarkerCanvas() {
  const { userPos, compassHeading } = useGPSLocation();
  const { zoomLevel, mapRotation } = useMapStore();

  if (!userPos) return null;

  // Scale position relative to current zoom level if canvas dimensions shrink
  const scale = Math.pow(1 / 1.5, MAX_ZOOM - zoomLevel);
  const posX = userPos.x * scale;
  const posY = userPos.y * scale;

  const headingAngle = userPos.heading !== null ? userPos.heading : compassHeading;

  return (
    <div
      className="absolute top-0 left-0 z-[130] pointer-events-none transition-transform duration-300 ease-out will-change-transform"
      style={{ transform: `translate3d(${posX}px, ${posY}px, 0) translate(-50%, -50%)` }}
    >
      {/* Outer Pulse Accuracy Ring */}
      <div
        className="w-10 h-10 rounded-full bg-blue-500/25 animate-ping absolute -inset-1"
        style={{ transform: `scale(${Math.min(2.5, Math.max(1, userPos.accuracy / 15))})` }}
      />
      {/* Inner Accuracy Radius Halo */}
      <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/40 absolute -inset-0.5" />

      {/* Core Glowing Blue Dot */}
      <div
        className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-xl relative flex items-center justify-center"
        style={{ transform: mapRotation !== 0 ? `rotate(${-mapRotation}deg)` : undefined }}
      >
        {headingAngle !== null && (
          <div
            className="w-1.5 h-4 bg-gradient-to-b from-blue-400 to-white rounded-full absolute -top-2 shadow-md transition-transform duration-200"
            style={{ transform: `rotate(${headingAngle}deg)` }}
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
          setIsLocating(false);
          if (typeof window !== 'undefined' && !window.isSecureContext) {
            alert('GPS requires HTTPS security. When testing over local IP on HTTP, please access via HTTPS or use dev host.');
          } else {
            alert('GPS location unavailable or indoor signal weak. Please allow location permissions in your browser settings.');
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
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
      className={`w-11 h-11 sm:w-11 sm:h-11 rounded-xl backdrop-blur-md border shadow-lg flex items-center justify-center font-bold text-lg transition-all ${
        isLocating
          ? 'bg-blue-600 border-blue-500 text-white animate-spin'
          : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
      }`}
    >
      🎯
    </button>
  );
}

export default LocationMarkerCanvas;
