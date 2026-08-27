'use client';

import React, { useState } from 'react';
import { useNavigationStore } from '@/stores/navigation-store';
import { useMapStore } from '@/stores/map-store';
import { zoomLevel4Tags } from '@/data/zoom-level-4';
import { buildings } from '@/data/buildings';
import { calculateRoute } from '@/lib/dijkstra';
import { MAX_ZOOM } from '@/lib/constants';

export default function DirectionsPanel() {
  const { showDirections, setShowDirections, isPinned, pinX, pinY, setZoomLevel } = useMapStore();
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

  const [fromSelection, setFromSelection] = useState<string>(from || 'main-gate');
  const [toSelection, setToSelection] = useState<string>(to || 'sf-block');
  const [error, setError] = useState<string | null>(null);

  if (!showDirections) return null;

  // Build sorted list of places for dropdowns
  const placeOptions = zoomLevel4Tags
    .map((tag) => ({ id: tag.id, name: tag.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleCalculateRoute = () => {
    setError(null);

    let fromArg: string | { x: number; y: number } = fromSelection;
    if (fromSelection === 'pinned-location') {
      if (!isPinned) {
        setError('Please drop a pin on the map first (long press or right click).');
        return;
      }
      fromArg = { x: pinX, y: pinY };
    }

    let toArg: string | { x: number; y: number } = toSelection;
    if (toSelection === 'pinned-location') {
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

  const handleSwap = () => {
    const temp = fromSelection;
    setFromSelection(toSelection);
    setToSelection(temp);
    if (isActive) {
      clearRoute();
    }
  };

  return (
    <div className="directions-panel dark:bg-slate-900/95 backdrop-blur-md dark:border dark:border-slate-700/80 dark:text-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400">Campus Directions</h3>
        <button
          onClick={() => setShowDirections(false)}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold px-2"
        >
          ✕
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 my-3">
        <button
          type="button"
          onClick={() => {
            setRouteType('pedestrian');
            if (isActive) clearRoute();
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            routeType === 'pedestrian'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          🚶 Walking
        </button>
        <button
          type="button"
          onClick={() => {
            setRouteType('vehicle');
            if (isActive) clearRoute();
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            routeType === 'vehicle'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          🚗 Vehicle
        </button>
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
            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
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
            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
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
        <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-lg text-xs font-medium">
          {error}
        </div>
      )}

      {/* Route Result Info */}
      {isActive && distance > 0 && (
        <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs">
          <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-1">
            Distance: {distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} m`}
          </div>
          <div className="text-slate-600 dark:text-slate-300 font-medium">
            Estimated time: {Math.max(1, Math.round(distance / (routeType === 'pedestrian' ? 80 : 250)))} min
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={handleCalculateRoute}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-md shadow-indigo-600/20"
        >
          Find Route
        </button>
        {isActive && (
          <button
            type="button"
            onClick={clearRoute}
            className="px-3 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-semibold text-xs transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
