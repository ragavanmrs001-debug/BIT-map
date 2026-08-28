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

  const { zoomLevel, activeLayer, theme, setZoomLevel, setPin, clearPin, isPinned, mapRotation, rotateMapBy } =
    useMapStore();

  const { width, height } = getMapDimensions(zoomLevel);
  const touchStartAngle = useRef(0);

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

  const lastWheelTime = useRef(0);
  const touchStartDist = useRef(0);
  const isTouchDragging = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  // Mouse & trackpad wheel zoom handler with strict horizontal swipe protection
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Ignore wheel zoom if user is primarily panning horizontally (left-to-right / right-to-left swipe)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const now = performance.now();
        // Debounce trackpad zoom changes (minimum 280ms threshold) to prevent rapid low-to-high zoom jitter
        if (now - lastWheelTime.current < 280) return;
        if (Math.abs(e.deltaY) < 18) return;

        lastWheelTime.current = now;
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

  // Touch event listeners for 60fps mobile touch drag & 2-finger pinch zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let touchRaf: number | null = null;
    let pendingTouchX = 0;
    let pendingTouchY = 0;

    const getDistance = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getAngle = (t1: Touch, t2: Touch) => {
      return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
    };

    const handleNativeTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.tag, button, input, select, .place-details, .directions-panel')) {
        return;
      }

      stopInertia();

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        isTouchDragging.current = true;
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        startX.current = touch.clientX;
        startY.current = touch.clientY;
        lastMousePos.current = { x: touch.clientX, y: touch.clientY, time: performance.now() };
        velocity.current = { vx: 0, vy: 0 };
        scrollLeftStart.current = el.scrollLeft;
        scrollTopStart.current = el.scrollTop;
      } else if (e.touches.length === 2) {
        isTouchDragging.current = false;
        touchStartDist.current = getDistance(e.touches[0], e.touches[1]);
        touchStartAngle.current = getAngle(e.touches[0], e.touches[1]);
      }
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.tag, button, input, select, .place-details, .directions-panel')) {
        return;
      }

      if (e.touches.length === 1 && isTouchDragging.current) {
        // Prevent default browser edge back-swipe navigation when dragging side to side
        e.preventDefault();

        const touch = e.touches[0];
        const now = performance.now();
        const dt = Math.max(now - lastMousePos.current.time, 1);
        const dx = touch.clientX - lastMousePos.current.x;
        const dy = touch.clientY - lastMousePos.current.y;

        velocity.current = { vx: dx / dt, vy: dy / dt };
        lastMousePos.current = { x: touch.clientX, y: touch.clientY, time: now };

        const totalWalkX = touch.clientX - startX.current;
        const totalWalkY = touch.clientY - startY.current;

        pendingTouchX = scrollLeftStart.current - totalWalkX;
        pendingTouchY = scrollTopStart.current - totalWalkY;

        if (touchRaf === null) {
          touchRaf = requestAnimationFrame(() => {
            if (el) {
              el.scrollLeft = pendingTouchX;
              el.scrollTop = pendingTouchY;
            }
            touchRaf = null;
          });
        }
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getDistance(e.touches[0], e.touches[1]);
        const deltaDist = dist - touchStartDist.current;
        const currentAngle = getAngle(e.touches[0], e.touches[1]);
        const deltaAngle = currentAngle - touchStartAngle.current;
        const now = performance.now();

        // Twist map rotation gesture
        if (Math.abs(deltaAngle) > 2) {
          rotateMapBy(deltaAngle);
          touchStartAngle.current = currentAngle;
        }

        // Pinch zoom gesture
        if (Math.abs(deltaDist) > 55 && now - lastWheelTime.current > 350) {
          lastWheelTime.current = now;
          if (deltaDist > 0) {
            handleZoom('in');
          } else {
            handleZoom('out');
          }
          touchStartDist.current = dist;
        }
      }
    };

    const handleNativeTouchEnd = () => {
      if (touchRaf !== null) {
        cancelAnimationFrame(touchRaf);
        touchRaf = null;
      }

      if (isTouchDragging.current && el) {
        isTouchDragging.current = false;
        let vx = velocity.current.vx * 14;
        let vy = velocity.current.vy * 14;

        const applyTouchInertia = () => {
          if (!el) return;
          if (Math.abs(vx) < 0.2 && Math.abs(vy) < 0.2) {
            inertiaAnimationId.current = null;
            return;
          }

          el.scrollLeft -= vx;
          el.scrollTop -= vy;
          vx *= 0.91;
          vy *= 0.91;

          inertiaAnimationId.current = requestAnimationFrame(applyTouchInertia);
        };

        stopInertia();
        inertiaAnimationId.current = requestAnimationFrame(applyTouchInertia);
      }
    };

    el.addEventListener('touchstart', handleNativeTouchStart, { passive: true });
    el.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    el.addEventListener('touchend', handleNativeTouchEnd, { passive: true });

    return () => {
      if (touchRaf !== null) cancelAnimationFrame(touchRaf);
      el.removeEventListener('touchstart', handleNativeTouchStart);
      el.removeEventListener('touchmove', handleNativeTouchMove);
      el.removeEventListener('touchend', handleNativeTouchEnd);
    };
  }, [handleZoom, stopInertia]);

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

  // React touch handlers for long-press pin drop
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.tag, button, input, select, .place-details, .directions-panel')) {
      return;
    }

    stopInertia();

    const touch = e.touches[0];
    const container = containerRef.current;
    if (!container) return;

    pressTimer.current = setTimeout(() => {
      const rect = container.getBoundingClientRect();
      const x = touch.clientX - rect.left + container.scrollLeft;
      const y = touch.clientY - rect.top + container.scrollTop;
      setPin(x, y);
    }, 850);
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
        className="relative transition-transform duration-100 ease-out"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          minWidth: `${width}px`,
          minHeight: `${height}px`,
          transform: mapRotation !== 0 ? `rotate(${mapRotation}deg)` : undefined,
          transformOrigin: 'center center',
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
