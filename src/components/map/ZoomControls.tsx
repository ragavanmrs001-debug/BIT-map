'use client';

import React, { useState } from 'react';
import { useMapStore } from '@/stores/map-store';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_FACTOR } from '@/lib/constants';
import { LocationMarkerButton } from './LocationMarker';
import Link from 'next/link';

export default function ZoomControls() {
  const {
    zoomLevel,
    setZoomLevel,
    toggleLayer,
    showDetails,
    setShowDirections,
    showDirections,
    theme,
    toggleTheme,
    viewMode,
    setViewMode,
    mapRotation,
    resetRotation,
    rotateMapBy,
  } = useMapStore();

  const [showDpad, setShowDpad] = useState(false);
  const isDark = theme === 'dark';

  const handleZoomIn = () => {
    if (zoomLevel < MAX_ZOOM) {
      const el = document.querySelector('.bg-map') as HTMLElement;
      if (el) {
        el.scrollTop *= ZOOM_FACTOR;
        el.scrollLeft *= ZOOM_FACTOR;
      }
      setZoomLevel(zoomLevel + 1);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > MIN_ZOOM) {
      const el = document.querySelector('.bg-map') as HTMLElement;
      if (el) {
        el.scrollTop /= ZOOM_FACTOR;
        el.scrollLeft /= ZOOM_FACTOR;
      }
      setZoomLevel(zoomLevel - 1);
    }
  };

  const handleFitCampus = () => {
    setZoomLevel(2);
    resetRotation();
    setTimeout(() => {
      const el = document.querySelector('.bg-map') as HTMLElement;
      if (el) {
        el.scrollTo({
          top: 400,
          left: 200,
          behavior: 'smooth',
        });
      }
    }, 50);
  };

  const handleStepPan = (dx: number, dy: number) => {
    const el = document.querySelector('.bg-map') as HTMLElement;
    if (el) {
      el.scrollBy({
        left: dx,
        top: dy,
        behavior: 'smooth',
      });
    }
  };

  const toggle3DMode = () => {
    if (viewMode === '2d') {
      setViewMode('3d-satellite');
    } else {
      setViewMode('2d');
    }
  };

  const handleCompassClick = () => {
    if (Math.abs(mapRotation) > 5) {
      resetRotation();
    } else {
      rotateMapBy(90);
    }
  };

  return (
    <>
      {/* Right side: zoom buttons + 3D Toggle + Compass + Location */}
      <div className={`fixed right-3 sm:right-5 bottom-6 sm:bottom-8 z-[140] flex flex-col gap-2 transition-all duration-300 ${showDetails ? 'bottom-[46vh]' : ''}`}>
        {/* 3D View Switcher */}
        <button
          onClick={toggle3DMode}
          title={viewMode === '2d' ? 'Switch to 3D View' : 'Switch to 2D Map'}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl shadow-lg border flex items-center justify-center font-bold text-xs transition-all duration-200 ${
            viewMode !== '2d'
              ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/30'
              : 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/30 hover:bg-indigo-700'
          }`}
        >
          {viewMode === '2d' ? '3D' : '2D'}
        </button>

        {/* 2D Map Controls */}
        {viewMode === '2d' && (
          <>
            {/* Interactive Compass Rotation Button */}
            <button
              onClick={handleCompassClick}
              title={`Compass Rotation (${Math.round(mapRotation)}°) - Click to rotate 90° or reset North`}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl backdrop-blur-md border shadow-lg flex items-center justify-center font-bold transition-all ${
                Math.abs(mapRotation) > 5
                  ? 'bg-amber-500 border-amber-400 text-white shadow-amber-500/30'
                  : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-red-500 dark:text-red-400 hover:bg-slate-100'
              }`}
            >
              <div
                className="text-base transition-transform duration-200"
                style={{ transform: `rotate(${-mapRotation}deg)` }}
              >
                🧭
              </div>
            </button>

            <button
              onClick={handleZoomIn}
              title="Zoom in"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-800 dark:text-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all font-bold text-lg"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom out"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-800 dark:text-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all font-bold text-lg"
            >
              −
            </button>
            <button
              onClick={handleFitCampus}
              title="Fit Full Campus Overview & Reset North"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-800 dark:text-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all font-bold text-base"
            >
              ⛶
            </button>

            {/* D-Pad Toggle */}
            <button
              onClick={() => setShowDpad(!showDpad)}
              title="Toggle Step Pan Controls"
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl backdrop-blur-md border shadow-lg flex items-center justify-center font-bold text-base transition-all ${
                showDpad
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-indigo-600 hover:text-white'
              }`}
            >
              📍
            </button>

            {/* Live GPS Location Button */}
            <LocationMarkerButton />
          </>
        )}
      </div>

      {/* D-Pad Navigation */}
      {showDpad && viewMode === '2d' && (
        <div className="fixed right-16 sm:right-20 bottom-16 z-40 bg-white/92 dark:bg-slate-900/92 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => handleStepPan(0, -350)}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center shadow"
            title="Step North"
          >
            ▲
          </button>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleStepPan(-350, 0)}
              className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center shadow"
              title="Step West"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={handleFitCampus}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center"
              title="Recenter"
            >
              ◉
            </button>
            <button
              type="button"
              onClick={() => handleStepPan(350, 0)}
              className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center shadow"
              title="Step East"
            >
              ▶
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleStepPan(0, 350)}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center shadow"
            title="Step South"
          >
            ▼
          </button>
        </div>
      )}

      {/* Left side: dark mode + about + layer + directions */}
      <div className={`fixed left-3 sm:left-5 bottom-6 sm:bottom-8 z-[140] flex flex-col gap-2 transition-all duration-300 ${showDetails ? 'bottom-[46vh]' : ''}`}>
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-800 dark:text-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all text-base"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* About Page */}
        <Link href="/about">
          <button
            title="About"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-800 dark:text-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all text-base font-bold"
          >
            ℹ️
          </button>
        </Link>

        {/* Layer toggle in 2D mode */}
        {viewMode === '2d' && (
          <button
            onClick={toggleLayer}
            title="Toggle SVG / Satellite"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-800 dark:text-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all text-base font-bold"
          >
            🗺️
          </button>
        )}

        {/* Directions */}
        <button
          onClick={() => setShowDirections(!showDirections)}
          title="Campus Directions"
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl backdrop-blur-md border shadow-lg flex items-center justify-center font-bold text-lg transition-all ${
            showDirections
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-emerald-600 hover:text-white'
          }`}
        >
          🚀
        </button>
      </div>
    </>
  );
}
