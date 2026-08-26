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
        className="place-details open dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:shadow-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="place-title text-primary dark:text-primary-light font-bold">{building?.name || tagName}</div>
        <div className="place-main dark:text-slate-400 font-medium">{building?.main || ''}</div>

        {building && building.floors.length > 0 && (
          <>
            <div className="floors dark:border-slate-800 dark:bg-gradient-to-b dark:from-slate-800/50 dark:to-transparent">
              <div
                className="underline bg-primary"
                style={{ transform: `translateX(${activeFloor * 100}px)` }}
              />
              {building.floors.map((floor, idx) => (
                <div
                  key={floor.name}
                  className={`floor ${idx === activeFloor ? 'active text-primary font-bold' : 'dark:text-slate-400'}`}
                  onClick={() => setActiveFloor(idx)}
                >
                  {floor.name}
                </div>
              ))}
            </div>

            {building.floors.map((floor, idx) => (
              <ul
                key={floor.name}
                className={`classes ${idx === activeFloor ? 'visible' : ''} dark:text-slate-200`}
              >
                {floor.rooms.map((room, roomIdx) => (
                  <li key={roomIdx} className="py-1">{room}</li>
                ))}
              </ul>
            ))}
          </>
        )}
      </div>

      {/* Down button */}
      <div className="get-down-btn open dark:bg-slate-800 dark:border-slate-600 dark:shadow-lg" onClick={handleClose}>
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
