'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useMapStore } from '@/stores/map-store';
import {
  MAP_SVG_PATH,
  MAP_SATELLITE_PATH,
  DEFAULT_SCROLL_LEFT,
  DEFAULT_SCROLL_TOP,
  getMapDimensions,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_FACTOR,
} from '@/lib/constants';
import TagsLayer from './TagsLayer';
import LegendsLayer from './LegendsLayer';
import ShapesLayer from './ShapesLayer';
import PinMarker from './PinMarker';
import RouteOverlay from './RouteOverlay';
import { LocationMarkerCanvas } from './LocationMarker';

export default function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseDown = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeftStart = useRef(0);
  const scrollTopStart = useRef(0);
  const lastTapTime = useRef(0);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  // Inertia momentum refs
  const lastMousePos = useRef({ x: 0, y: 0, time: 0 });
  const velocity = useRef({ vx: 0, vy: 0 });
  const inertiaAnimationId = useRef<number | null>(null);

  const { zoomLevel, activeLayer, theme, setZoomLevel, setPin, clearPin, isPinned } =
    useMapStore();

  const { width, height } = getMapDimensions(zoomLevel);

  // Stop any running inertia momentum glide
  const stopInertia = useCallback(() => {
    if (inertiaAnimationId.current !== null) {
      cancelAnimationFrame(inertiaAnimationId.current);
      inertiaAnimationId.current = null;
    }
  }, []);

  // Initial scroll position - center on main academic area
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop =
        DEFAULT_SCROLL_TOP - window.innerHeight / 2 + 150;
      containerRef.current.scrollLeft =
        DEFAULT_SCROLL_LEFT - window.innerWidth / 2;
    }
  }, []);

  // Zoom function
  const handleZoom = useCallback(
    (direction: 'in' | 'out') => {
      if (!containerRef.current) return;
      stopInertia();

      if (direction === 'in' && zoomLevel < MAX_ZOOM) {
        const el = containerRef.current;
        el.scrollTop *= ZOOM_FACTOR;
        el.scrollLeft *= ZOOM_FACTOR;
        setZoomLevel(zoomLevel + 1);
      } else if (direction === 'out' && zoomLevel > MIN_ZOOM) {
        const el = containerRef.current;
        el.scrollTop /= ZOOM_FACTOR;
        el.scrollLeft /= ZOOM_FACTOR;
        setZoomLevel(zoomLevel - 1);
      }
    },
    [zoomLevel, setZoomLevel, stopInertia]
  );

  // Mouse wheel zoom (strictly when holding Ctrl/Cmd key to isolate scroll drag)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        stopInertia();
        if (e.deltaY < 0) {
          handleZoom('in');
        } else {
          handleZoom('out');
        }
      }
    },
    [handleZoom, stopInertia]
  );

  // Global window mousemove & mouseup listeners for 60fps kinetic inertia momentum
  useEffect(() => {
    let rafId: number | null = null;
    let pendingX = 0;
    let pendingY = 0;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isMouseDown.current || !containerRef.current) return;

      const now = performance.now();
      const dt = Math.max(now - lastMousePos.current.time, 1);
      const dx = e.pageX - lastMousePos.current.x;
      const dy = e.pageY - lastMousePos.current.y;

      velocity.current = { vx: dx / dt, vy: dy / dt };
      lastMousePos.current = { x: e.pageX, y: e.pageY, time: now };

      const totalWalkX = e.pageX - startX.current;
      const totalWalkY = e.pageY - startY.current;

      if (!isDragging.current && (Math.abs(totalWalkX) > 3 || Math.abs(totalWalkY) > 3)) {
        isDragging.current = true;
      }

      if (isDragging.current) {
        pendingX = scrollLeftStart.current - totalWalkX;
        pendingY = scrollTopStart.current - totalWalkY;

        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.scrollLeft = pendingX;
              containerRef.current.scrollTop = pendingY;
            }
            rafId = null;
          });
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (!isMouseDown.current) return;
      isMouseDown.current = false;

      // Kinetic Inertia Glide after release
      if (isDragging.current && containerRef.current) {
        let vx = velocity.current.vx * 16;
        let vy = velocity.current.vy * 16;

        const applyInertia = () => {
          if (!containerRef.current) return;
          if (Math.abs(vx) < 0.2 && Math.abs(vy) < 0.2) {
            inertiaAnimationId.current = null;
            return;
          }

          containerRef.current.scrollLeft -= vx;
          containerRef.current.scrollTop -= vy;

          // Friction deceleration (0.92 decay)
          vx *= 0.92;
          vy *= 0.92;

          inertiaAnimationId.current = requestAnimationFrame(applyInertia);
        };

        stopInertia();
        inertiaAnimationId.current = requestAnimationFrame(applyInertia);
      }

      setTimeout(() => {
        isDragging.current = false;
      }, 50);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      stopInertia();
    };
  }, [stopInertia]);

  // Mouse down on container to start drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.tag, button, input, select, .place-details, .directions-panel, .url-box')) {
      return;
    }

    stopInertia();
    isMouseDown.current = true;
    isDragging.current = false;
    startX.current = e.pageX;
    startY.current = e.pageY;
    lastMousePos.current = { x: e.pageX, y: e.pageY, time: performance.now() };
    velocity.current = { vx: 0, vy: 0 };
    scrollLeftStart.current = containerRef.current?.scrollLeft || 0;
    scrollTopStart.current = containerRef.current?.scrollTop || 0;
  };

  // Touch handlers for mobile pan & long-press pin drop (no accidental zoom on touch drag)
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.tag, button, input, select, .place-details, .directions-panel')) {
      return;
    }

    stopInertia();

    // Long press for pin drop
    const touch = e.touches[0];
    const container = containerRef.current;
    if (!container) return;

    pressTimer.current = setTimeout(() => {
      const rect = container.getBoundingClientRect();
      const x = touch.clientX - rect.left + container.scrollLeft;
      const y = touch.clientY - rect.top + container.scrollTop;
      setPin(x, y);
    }, 800);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  // Map click to clear pin
  const handleMapClick = (e: React.MouseEvent) => {
    if (isDragging.current) return;
    const target = e.target as HTMLElement;
    if (target.closest('.tag, button, input, select, .place-details, .directions-panel, .url-box, #pin')) {
      return;
    }

    if (isPinned) {
      clearPin();
    }
  };

  // Context menu for pin on desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const target = e.target as HTMLElement;
    if (target.closest('.tag, button, input, select, .place-details, .directions-panel')) {
      return;
    }

    const x = e.clientX + container.scrollLeft - container.getBoundingClientRect().left;
    const y = e.clientY + container.scrollTop - container.getBoundingClientRect().top;
    setPin(x, y);
  };

  const isDark = theme === 'dark';

  return (
    <div
      ref={containerRef}
      className={`bg-map cursor-grab active:cursor-grabbing select-none w-screen h-screen overflow-auto ${
        isDark ? 'bg-slate-950' : 'bg-slate-100'
      }`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onWheel={handleWheel}
      onClick={handleMapClick}
      onContextMenu={handleContextMenu}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {/* Centered Map Wrapper with Full Canvas Panning Space */}
      <div
        className="relative"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          minWidth: `${width}px`,
          minHeight: `${height}px`,
        }}
      >
        {/* SVG Map Layer */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MAP_SVG_PATH}
          alt="SVG map"
          width={width}
          height={height}
          style={{
            display: activeLayer === 'svg' ? 'block' : 'none',
            filter: isDark
              ? 'invert(0.92) hue-rotate(190deg) contrast(1.15) brightness(0.95)'
              : 'none',
            transition: 'filter 0.3s ease',
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
          draggable={false}
        />

        {/* Satellite Layer */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MAP_SATELLITE_PATH}
          alt="Satellite Map"
          width={width}
          height={height}
          style={{
            display: activeLayer === 'satellite' ? 'block' : 'none',
            filter: isDark ? 'brightness(0.75) contrast(1.2)' : 'none',
            transition: 'filter 0.3s ease',
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
          loading="lazy"
          draggable={false}
        />

        {/* Building Shapes Footprints */}
        <ShapesLayer />

        {/* Tags */}
        <TagsLayer />

        {/* Legends */}
        <LegendsLayer />

        {/* Pin */}
        <PinMarker />

        {/* Route */}
        <RouteOverlay />

        {/* Real-time GPS Location Canvas Marker */}
        <LocationMarkerCanvas />
      </div>
    </div>
  );
}
