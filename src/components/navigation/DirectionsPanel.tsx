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
    <div className="directions-panel dark:bg-slate-900 dark:border dark:border-slate-700 dark:text-white dark:shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
        <h3 className="font-bold text-lg text-primary dark:text-primary-light">Campus Directions</h3>
        <button
          onClick={() => setShowDirections(false)}
          className="text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white text-lg font-bold px-2"
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
          className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
            routeType === 'pedestrian'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
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
          className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
            routeType === 'vehicle'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
          }`}
        >
          🚗 Vehicle
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-2 text-xs">
        <div>
          <label className="block text-gray-600 dark:text-slate-400 font-semibold mb-1">From:</label>
          <select
            value={fromSelection}
            onChange={(e) => {
              setFromSelection(e.target.value);
              setFrom(e.target.value);
            }}
            className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 dark:text-white font-medium"
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
            className="p-1 text-gray-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary-light transition-colors text-sm"
          >
            ⇅ Swap
          </button>
        </div>

        <div>
          <label className="block text-gray-600 dark:text-slate-400 font-semibold mb-1">To:</label>
          <select
            value={toSelection}
            onChange={(e) => {
              setToSelection(e.target.value);
              setTo(e.target.value);
            }}
            className="w-full p-2 border border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 dark:text-white font-medium"
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
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded text-xs">
          {error}
        </div>
      )}

      {/* Route Result Info */}
      {isActive && distance > 0 && (
        <div className="mt-3 p-2.5 bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40 rounded text-xs">
          <div className="font-bold text-primary dark:text-primary-light text-sm mb-1">
            Distance: {distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} m`}
          </div>
          <div className="text-gray-600 dark:text-slate-300">
            Estimated time: {Math.max(1, Math.round(distance / (routeType === 'pedestrian' ? 80 : 250)))} min
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={handleCalculateRoute}
          className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white rounded font-bold text-xs transition-colors shadow"
        >
          Find Route
        </button>
        {isActive && (
          <button
            type="button"
            onClick={clearRoute}
            className="px-3 py-2 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 rounded font-semibold text-xs transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
