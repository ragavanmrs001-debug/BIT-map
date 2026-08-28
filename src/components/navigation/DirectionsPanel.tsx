'use client';

import React, { useState, useMemo } from 'react';
import { useNavigationStore, type RouteType } from '@/stores/navigation-store';
import { useMapStore } from '@/stores/map-store';
import { zoomLevel4Tags } from '@/data/zoom-level-4';
import { buildings } from '@/data/buildings';
import { calculateRoute } from '@/lib/dijkstra';
import { MAX_ZOOM } from '@/lib/constants';

export default function DirectionsPanel() {
  const { showDirections, setShowDirections, isPinned, pinX, pinY, setZoomLevel, userCanvasPos } = useMapStore();
  const {
    from,
    to,
    routeType,
    distance,
    isActive,
    setFrom,
    setTo,
    setRouteType,
    setRoute,
    clearRoute,
  } = useNavigationStore();

  const [fromSelection, setFromSelection] = useState<string>(from || 'my-location');
  const [toSelection, setToSelection] = useState<string>(to || 'sf-block');
  const [error, setError] = useState<string | null>(null);

  // Sync state when store's from/to changes
  React.useEffect(() => {
    if (from) setFromSelection(from);
    if (to) setToSelection(to);
  }, [from, to]);

  // Build combined list of places (tags + buildings) for dropdowns
  const placeOptions = useMemo(() => {
    const map = new Map<string, string>();
    zoomLevel4Tags.forEach((t) => map.set(t.id, t.name));
    buildings.forEach((b) => map.set(b.id, b.name));

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const handleCalculateRoute = (overrideFrom?: string, overrideTo?: string) => {
    setError(null);
    const activeFrom = overrideFrom || fromSelection || from || 'my-location';
    const activeTo = overrideTo || toSelection || to || 'sf-block';

    let fromArg: string | { x: number; y: number } = activeFrom;
    if (activeFrom === 'my-location') {
      if (userCanvasPos) {
        fromArg = { x: userCanvasPos.x, y: userCanvasPos.y };
      } else {
        // Fallback default campus quad center if live GPS is pending permission
        fromArg = { x: 1700, y: 1950 };
      }
    } else if (activeFrom === 'pinned-location') {
      if (!isPinned) {
        setError('Please drop a pin on the map first (long press or right click).');
        return;
      }
      fromArg = { x: pinX, y: pinY };
    }

    let toArg: string | { x: number; y: number } = activeTo;
    if (activeTo === 'my-location') {
      if (userCanvasPos) {
        toArg = { x: userCanvasPos.x, y: userCanvasPos.y };
      } else {
        toArg = { x: 1700, y: 1950 };
      }
    } else if (activeTo === 'pinned-location') {
      if (!isPinned) {
        setError('Please drop a pin on the map first (long press or right click).');
        return;
      }
      toArg = { x: pinX, y: pinY };
    }

    const route = calculateRoute(fromArg, toArg, routeType);
    if (!route || route.nodePath.length === 0) {
      setError('No direct route found between these locations.');
      return;
    }

    const coords = route.nodePath.map((node) => ({ x: node.left, y: node.top }));
    setRoute(route.path, coords, route.steps, route.distance, route.startingPoint, route.endingPoint);
    setShowDirections(false); // Switch to turn-by-turn floating view

    // Zoom and scroll to starting point
    setZoomLevel(MAX_ZOOM);
    const container = document.querySelector('.bg-map') as HTMLElement;
    if (container && route.startingPoint) {
      container.scrollTo({
        left: route.startingPoint.x - window.innerWidth / 2,
        top: route.startingPoint.y - window.innerHeight / 2,
        behavior: 'smooth',
      });
    }
  };

  // Auto calculate route when panel opens with active from & to parameters
  React.useEffect(() => {
    if (showDirections && from && to) {
      setFromSelection(from);
      setToSelection(to);
      handleCalculateRoute(from, to);
    }
    // eslint-disable-next-line react-hooks-exhaustive-deps
  }, [showDirections, from, to]);

  if (!showDirections) return null;

  const handleSwap = () => {
    const temp = fromSelection;
    setFromSelection(toSelection);
    setToSelection(temp);
    setFrom(toSelection);
    setTo(temp);
    if (isActive) {
      clearRoute();
    }
  };

  const ROUTE_MODES: { type: RouteType; label: string; icon: string }[] = [
    { type: 'pedestrian', label: 'Walking', icon: '🚶' },
    { type: 'vehicle', label: 'Vehicle', icon: '🚗' },
    { type: 'sheltered', label: 'Covered Walk', icon: '☂️' },
    { type: 'accessible', label: 'Accessible', icon: '♿' },
  ];

  return (
    <div className="directions-panel bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl rounded-2xl p-4 transition-all z-[150]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺️</span>
          <h3 className="font-bold text-base text-indigo-600 dark:text-indigo-400">Campus Directions</h3>
        </div>
        <button
          onClick={() => setShowDirections(false)}
          className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center text-xs font-bold"
        >
          ✕
        </button>
      </div>

      {/* Mode Toggle Grid */}
      <div className="grid grid-cols-2 gap-1.5 my-3">
        {ROUTE_MODES.map((mode) => (
          <button
            key={mode.type}
            type="button"
            onClick={() => {
              setRouteType(mode.type);
              if (isActive) clearRoute();
            }}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              routeType === mode.type
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-102'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="space-y-2.5 text-xs">
        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">From:</label>
          <select
            value={fromSelection}
            onChange={(e) => {
              setFromSelection(e.target.value);
              setFrom(e.target.value);
            }}
            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="my-location">🎯 My Live Location</option>
            {isPinned && <option value="pinned-location">📍 Pinned Location</option>}
            {placeOptions.map((p) => (
              <option key={`from-${p.id}`} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Origin and Destination"
            className="px-3 py-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-semibold text-xs transition-colors flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 rounded-full border border-slate-200 dark:border-slate-700"
          >
            ⇅ Swap Locations
          </button>
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">To:</label>
          <select
            value={toSelection}
            onChange={(e) => {
              setToSelection(e.target.value);
              setTo(e.target.value);
            }}
            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="my-location">🎯 My Live Location</option>
            {isPinned && <option value="pinned-location">📍 Pinned Location</option>}
            {placeOptions.map((p) => (
              <option key={`to-${p.id}`} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Route Result Info */}
      {isActive && distance > 0 && (
        <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs">
          <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-1">
            Distance: {distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} m`}
          </div>
          <div className="text-slate-600 dark:text-slate-300 font-medium">
            Est. time: {Math.max(1, Math.round(distance / (routeType === 'pedestrian' ? 80 : 250)))} min
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={() => handleCalculateRoute()}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-indigo-600/20"
        >
          Find Route
        </button>
        {isActive && (
          <button
            type="button"
            onClick={clearRoute}
            className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
