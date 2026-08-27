'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useMapStore } from '@/stores/map-store';
import { useNavigationStore } from '@/stores/navigation-store';
import { useFavoritesStore } from '@/stores/favorites-store';
import { buildings } from '@/data/buildings';
import { zoomLevel4Tags } from '@/data/zoom-level-4';
import { globalVoiceTracker } from '@/lib/voice-tracker';
import FloorPlanModal from './FloorPlanModal';

export default function PlaceDetails() {
  const { selectedPlaceId, showDetails, clearSelection, setShowDirections, setPin } = useMapStore();
  const { setTo } = useNavigationStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  const [activeFloor, setActiveFloor] = useState(0);
  const [showFloorModal, setShowFloorModal] = useState(false);

  const detailsRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Find building data for selected place
  const building = useMemo(() => {
    if (!selectedPlaceId) return null;
    return buildings.find((b) => b.id === selectedPlaceId) || null;
  }, [selectedPlaceId]);

  // Find tag details for selected place
  const tag = useMemo(() => {
    if (!selectedPlaceId) return null;
    return zoomLevel4Tags.find((t) => t.id === selectedPlaceId) || null;
  }, [selectedPlaceId]);

  const titleName = building?.name || tag?.name || 'Selected Campus Location';
  const favorited = selectedPlaceId ? isFavorite(selectedPlaceId) : false;

  // Reset active floor when place changes
  useEffect(() => {
    setActiveFloor(0);
    setShowFloorModal(false);
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
    setShowFloorModal(false);
  };

  const handleNavigateHere = () => {
    if (selectedPlaceId) {
      setTo(selectedPlaceId);
      setShowDirections(true);
      clearSelection();
    }
  };

  const handleDropPin = () => {
    if (tag) {
      const top = parseFloat(tag.top);
      const left = parseFloat(tag.left);
      setPin(left, top);
    }
  };

  const handleToggleFav = () => {
    if (selectedPlaceId) {
      toggleFavorite({
        id: selectedPlaceId,
        name: titleName,
        category: building?.main || 'Campus Location',
      });
    }
  };

  const handleVoiceReadout = () => {
    const textToSpeak = building
      ? `${building.name}. ${building.main}. Available floors: ${building.floors.map((f) => f.name).join(', ')}.`
      : `${titleName}. Campus point of interest.`;
    globalVoiceTracker.speak(textToSpeak);
  };

  if (!showDetails) return null;

  return (
    <>
      {/* Place details panel */}
      <div
        ref={detailsRef}
        className="place-details open z-[210] dark:bg-slate-900/95 dark:border-slate-800 dark:text-white shadow-2xl backdrop-blur-xl border-t border-slate-200"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header Title, Favorite Star & Close Button */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="place-title text-indigo-600 dark:text-indigo-400 font-bold text-xl leading-tight">
                {titleName}
              </div>
              <button
                onClick={handleToggleFav}
                className="text-lg hover:scale-110 transition-transform"
                title={favorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                {favorited ? '⭐' : '☆'}
              </button>
            </div>
            <div className="place-main dark:text-slate-400 text-sm font-medium mt-0.5">
              {building?.main || 'BIT Campus Facility'}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors font-bold text-sm"
            title="Close details"
          >
            ✕
          </button>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex items-center gap-2 my-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap">
          <button
            onClick={handleNavigateHere}
            className="flex-1 min-w-[120px] py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
          >
            <span>🚶</span> Navigate Here
          </button>

          {building && building.floors.length > 0 && (
            <button
              onClick={() => setShowFloorModal(true)}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1"
            >
              <span>🏛️</span> Floor Schematic
            </button>
          )}

          <button
            onClick={handleDropPin}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1"
            title="Drop Pin"
          >
            <span>📍</span> Pin
          </button>
          <button
            onClick={handleVoiceReadout}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1"
            title="Voice Readout"
          >
            <span>🔊</span> Listen
          </button>
        </div>

        {building && building.floors.length > 0 && (
          <>
            {/* Floor selector tabs */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
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
                className={`classes ${idx === activeFloor ? 'visible' : ''} dark:text-slate-200 mt-2 space-y-1.5 max-h-[140px] overflow-y-auto pr-2`}
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

      {/* Interactive Building Floor Schematic Modal */}
      {showFloorModal && selectedPlaceId && (
        <FloorPlanModal
          buildingId={selectedPlaceId}
          onClose={() => setShowFloorModal(false)}
        />
      )}
    </>
  );
}
