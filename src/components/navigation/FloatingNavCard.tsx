'use client';

import React, { useEffect } from 'react';
import { useNavigationStore } from '@/stores/navigation-store';
import { useMapStore } from '@/stores/map-store';
import { MAX_ZOOM } from '@/lib/constants';

export default function FloatingNavCard() {
  const {
    isActive,
    steps,
    currentStepIndex,
    isSimulating,
    distance,
    routeType,
    nextStep,
    prevStep,
    toggleSimulation,
    clearRoute,
  } = useNavigationStore();

  const { setZoomLevel } = useMapStore();

  const currentStep = steps[currentStepIndex];

  // Pan to current step point
  useEffect(() => {
    if (!isActive || !currentStep) return;

    setZoomLevel(MAX_ZOOM);
    const container = document.querySelector('.bg-map') as HTMLElement;
    if (container && currentStep.point) {
      const targetX = currentStep.point.x - window.innerWidth / 2;
      const targetY = currentStep.point.y - window.innerHeight / 2;

      // Smooth scroll glide to the step location
      container.scrollTo({
        left: targetX,
        top: targetY,
        behavior: 'smooth',
      });
    }
  }, [currentStepIndex, isActive, currentStep, setZoomLevel]);

  // Simulation auto-walk timer
  useEffect(() => {
    if (!isSimulating || !isActive) return;

    const interval = setInterval(() => {
      const { currentStepIndex: idx, steps: allSteps } = useNavigationStore.getState();
      if (idx < allSteps.length - 1) {
        nextStep();
      } else {
        toggleSimulation(); // Stop at destination
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isSimulating, isActive, nextStep, toggleSimulation]);

  if (!isActive || steps.length === 0 || !currentStep) return null;

  // Turn icon selection
  let turnIcon = '⬆️';
  if (currentStep.text.toLowerCase().includes('left')) turnIcon = '⬅️';
  else if (currentStep.text.toLowerCase().includes('right')) turnIcon = '➡️';
  else if (currentStep.text.toLowerCase().includes('arrive') || currentStepIndex === steps.length - 1) turnIcon = '🏁';
  else if (currentStep.text.toLowerCase().includes('start')) turnIcon = '📍';

  return (
    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-lg">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 p-4 transition-all animate-in fade-in slide-in-from-top-4 duration-300">
        {/* Top bar: icon + instruction + close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center text-xl font-bold shadow-md">
              {turnIcon}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary">
                Step {currentStepIndex + 1} of {steps.length}
              </div>
              <div className="text-sm md:text-base font-bold text-gray-900 dark:text-white leading-tight">
                {currentStep.text}
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {currentStep.instruction}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={clearRoute}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white text-lg font-bold"
            title="Exit Navigation"
          >
            ✕
          </button>
        </div>

        {/* Route Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full my-3 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-500 rounded-full"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Bottom controls: Prev, Auto-Walk, Next */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
              currentStepIndex === 0
                ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-slate-800 text-gray-400'
                : 'bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white'
            }`}
          >
            ◀ Prev Step
          </button>

          <button
            type="button"
            onClick={toggleSimulation}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow ${
              isSimulating
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                : 'bg-primary/15 dark:bg-primary/30 text-primary dark:text-primary-light hover:bg-primary/25'
            }`}
          >
            {isSimulating ? '⏸ Pause Walk' : '▶ Auto-Walk'}
          </button>

          <button
            type="button"
            onClick={nextStep}
            disabled={currentStepIndex === steps.length - 1}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
              currentStepIndex === steps.length - 1
                ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-slate-800 text-gray-400'
                : 'bg-primary hover:bg-primary-hover text-white shadow'
            }`}
          >
            Next Step ▶
          </button>
        </div>

        {/* Distance & Time summary */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800/80">
          <span>Total: <strong className="text-gray-700 dark:text-slate-200">{distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} m`}</strong></span>
          <span>Est. Time: <strong className="text-gray-700 dark:text-slate-200">{Math.max(1, Math.round(distance / (routeType === 'pedestrian' ? 80 : 250)))} min</strong></span>
        </div>
      </div>
    </div>
  );
}
