'use client';

import React, { useState } from 'react';
import { useMapStore } from '@/stores/map-store';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_FACTOR } from '@/lib/constants';
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

  return (
    <>
      {/* Right side: zoom buttons + 3D Toggle + D-Pad Steps */}
      <div className={`zoom-buttons ${showDetails ? 'shifted' : ''}`}>
        {/* 3D View Switcher */}
        <button
          className="icon-button"
          onClick={toggle3DMode}
          title={viewMode === '2d' ? 'Switch to 3D View' : 'Switch to 2D Map'}
          style={{
            background: viewMode !== '2d' ? '#10B981' : undefined,
            fontWeight: 'bold',
            fontSize: '13px',
            color: 'white',
          }}
        >
          {viewMode === '2d' ? '3D' : '2D'}
        </button>

        {/* 2D Zoom Controls */}
        {viewMode === '2d' && (
          <>
            <button className="icon-button" onClick={handleZoomIn} title="Zoom in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/icons/plus.svg" alt="Zoom in" />
            </button>
            <button className="icon-button" onClick={handleZoomOut} title="Zoom out">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/icons/minus.svg" alt="Zoom out" />
            </button>
            <button
              className="icon-button font-bold text-xs text-white"
              onClick={handleFitCampus}
              title="Fit Full Campus Overview"
            >
              ⛶
            </button>

            {/* D-Pad Toggle */}
            <button
              className="icon-button font-bold text-sm text-white"
              onClick={() => setShowDpad(!showDpad)}
              title="Toggle Step Pan Controls"
              style={{ background: showDpad ? '#6366F1' : undefined }}
            >
              🧭
            </button>
          </>
        )}
      </div>

      {/* Google Maps-style Step Pan D-Pad Navigation */}
      {showDpad && viewMode === '2d' && (
        <div className="fixed right-20 bottom-16 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => handleStepPan(0, -350)}
            className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center shadow"
            title="Step North"
          >
            ▲
          </button>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleStepPan(-350, 0)}
              className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center shadow"
              title="Step West"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={handleFitCampus}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center justify-center"
              title="Recenter"
            >
              ◉
            </button>
            <button
              type="button"
              onClick={() => handleStepPan(350, 0)}
              className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center shadow"
              title="Step East"
            >
              ▶
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleStepPan(0, 350)}
            className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center justify-center shadow"
            title="Step South"
          >
            ▼
          </button>
        </div>
      )}

      {/* Left side: info + layer + directions + dark mode */}
      <div className={`layer-button ${showDetails ? 'shifted' : ''}`}>
        {/* Dark Mode Toggle */}
        <button
          className="icon-button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ fontSize: '18px' }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* About Page */}
        <Link href="/about">
          <button className="icon-button" title="About">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/icons/info.svg" alt="Info" />
          </button>
        </Link>

        {/* Layer toggle in 2D mode */}
        {viewMode === '2d' && (
          <button className="icon-button" onClick={toggleLayer} title="Toggle SVG / Satellite">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/icons/layer.svg" alt="Toggle layer" />
          </button>
        )}

        {/* Directions */}
        <button
          className="icon-button"
          onClick={() => setShowDirections(!showDirections)}
          title="Campus Directions"
          style={{
            fontSize: '20px',
            color: 'white',
            fontWeight: 'bold',
            background: showDirections ? '#10B981' : undefined,
          }}
        >
          ⇢
        </button>
      </div>
    </>
  );
}
