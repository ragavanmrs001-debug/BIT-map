'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useMapStore } from '@/stores/map-store';
import { buildings } from '@/data/buildings';
import { zoomLevel4Tags } from '@/data/zoom-level-4';

export default function PlaceDetails() {
  const { selectedPlaceId, showDetails, clearSelection } = useMapStore();
  const [activeFloor, setActiveFloor] = useState(0);
  const detailsRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Find building data for selected place
  const building = useMemo(() => {
    if (!selectedPlaceId) return null;
    return buildings.find((b) => b.id === selectedPlaceId) || null;
  }, [selectedPlaceId]);

  // Find tag name for non-building places
  const tagName = useMemo(() => {
    if (!selectedPlaceId) return '';
    const tag = zoomLevel4Tags.find((t) => t.id === selectedPlaceId);
    return tag?.name || '';
  }, [selectedPlaceId]);

  // Reset active floor when place changes
  useEffect(() => {
    setActiveFloor(0);
  }, [selectedPlaceId]);

  // Swipe down to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    if (endY - touchStartY.current > 50) {
      handleClose();
    }
  };

  const handleClose = () => {
    clearSelection();
    setActiveFloor(0);
  };

  if (!showDetails) return null;

  return (
    <>
      {/* Place details panel */}
      <div
        ref={detailsRef}
        className="place-details open z-[210] dark:bg-slate-900 dark:border-slate-700 dark:text-white shadow-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="place-title text-indigo-600 dark:text-indigo-400 font-bold text-xl leading-tight">
              {building?.name || tagName}
            </div>
            <div className="place-main dark:text-slate-400 text-sm font-medium mt-0.5">
              {building?.main || 'Campus Location'}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
            title="Close details"
          >
            ✕
          </button>
        </div>

        {building && building.floors.length > 0 && (
          <>
            {/* Floor selector tabs */}
            <div className="flex items-center gap-2 overflow-x-auto py-3 my-2 scrollbar-none border-b border-slate-100 dark:border-slate-800">
              {building.floors.map((floor, idx) => (
                <button
                  key={floor.name}
                  onClick={() => setActiveFloor(idx)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    idx === activeFloor
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {floor.name}
                </button>
              ))}
            </div>

            {/* Room list */}
            {building.floors.map((floor, idx) => (
              <ul
                key={floor.name}
                className={`classes ${idx === activeFloor ? 'visible' : ''} dark:text-slate-200 mt-2 space-y-1.5 max-h-[160px] overflow-y-auto pr-2`}
              >
                {floor.rooms.map((room, roomIdx) => (
                  <li key={roomIdx} className="text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    <span>{room}</span>
                  </li>
                ))}
              </ul>
            ))}
          </>
        )}
      </div>

      {/* Down button */}
      <div className="get-down-btn open z-[210] dark:bg-slate-800 dark:border-slate-600 shadow-xl" onClick={handleClose}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/icons/down.svg"
          className="down-arrow"
          alt="Down arrow"
        />
      </div>
    </>
  );
}
