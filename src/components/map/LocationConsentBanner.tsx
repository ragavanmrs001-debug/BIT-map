'use client';

import React, { useEffect, useState } from 'react';
import { useMapStore } from '@/stores/map-store';
import { gpsToCanvasCoords } from './LocationMarker';
import { MAX_ZOOM } from '@/lib/constants';

export default function LocationConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const { setZoomLevel } = useMapStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check existing consent choice in localStorage
    const consent = localStorage.getItem('bit_map_location_consent');
    if (!consent) {
      // Delay presentation slightly for smooth entrance after page initial render
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnableLocation = () => {
    setIsRequesting(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const { x, y } = gpsToCanvasCoords(lat, lng);

          // Center map on live position
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

          localStorage.setItem('bit_map_location_consent', 'granted');
          setIsRequesting(false);
          setShowBanner(false);
        },
        (err) => {
          console.warn('Location consent permission error:', err.message);
          setIsRequesting(false);
          localStorage.setItem('bit_map_location_consent', 'denied');
          setShowBanner(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
      );
    } else {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('bit_map_location_consent', 'dismissed');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[200] w-[92%] max-w-lg animate-in slide-in-from-top-4 duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 dark:border-indigo-500/40 p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 dark:text-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
            🎯
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight text-slate-900 dark:text-white">
              Enable Live Campus GPS
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Allow BIT-map to track your position in real-time for exact navigation and distance estimates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={handleEnableLocation}
            disabled={isRequesting}
            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isRequesting ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <span>Enable GPS</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
