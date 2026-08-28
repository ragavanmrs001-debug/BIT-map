'use client';

import React, { useEffect, useRef } from 'react';
import { useNavigationStore } from '@/stores/navigation-store';
import { useMapStore } from '@/stores/map-store';
import { MAX_ZOOM, PX_TO_METERS } from '@/lib/constants';
import { globalVoiceTracker } from '@/lib/voice-tracker';
import { calculateRoute } from '@/lib/dijkstra';

export default function FloatingNavCard() {
  const {
    from,
    to,
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
    setRoute,
  } = useNavigationStore();

  const { setZoomLevel } = useMapStore();
  const lastRecalibrateTime = useRef(0);
  const lastSpokenStepIndex = useRef<number | null>(null);

  const currentStep = steps[currentStepIndex];

  // Pan to current step point & speak voice instruction
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

    // Speak turn-by-turn navigation voice instruction ONLY once per step transition
    if (globalVoiceTracker.isEnabled() && lastSpokenStepIndex.current !== currentStepIndex) {
      lastSpokenStepIndex.current = currentStepIndex;
      globalVoiceTracker.speak(`${currentStep.text}. ${currentStep.instruction}`);
    }
  }, [currentStepIndex, isActive, currentStep, setZoomLevel]);

  // Off-route monitoring & auto-recalibration
  useEffect(() => {
    if (!isActive || !to || !currentStep) return;

    const handleGpsUpdate = (e: CustomEvent) => {
      const { coords } = e.detail || {};
      if (!coords || !currentStep.point) return;

      const dx = coords.x - currentStep.point.x;
      const dy = coords.y - currentStep.point.y;
      const deviationMeters = Math.sqrt(dx * dx + dy * dy) * PX_TO_METERS;

      const now = Date.now();
      // Recalculate if user strays > 15m and at least 8 seconds since last recalibration
      if (deviationMeters > 15 && now - lastRecalibrateTime.current > 8000) {
        lastRecalibrateTime.current = now;
        const newRoute = calculateRoute({ x: coords.x, y: coords.y }, to, routeType);
        if (newRoute && newRoute.nodePath.length > 0) {
          const newCoords = newRoute.nodePath.map((node) => ({ x: node.left, y: node.top }));
          setRoute(
            newRoute.path,
            newCoords,
            newRoute.steps,
            newRoute.distance,
            newRoute.startingPoint,
            newRoute.endingPoint
          );
          if (globalVoiceTracker.isEnabled()) {
            globalVoiceTracker.speak('Rerouting. New shortest path updated.');
          }
        }
      }
    };

    window.addEventListener('gps-update' as any, handleGpsUpdate);
    return () => window.removeEventListener('gps-update' as any, handleGpsUpdate);
  }, [isActive, to, currentStep, routeType, setRoute]);

  // Simulation auto-walk timer
  useEffect(() => {
    if (!isSimulating || !isActive) return;

    const interval = setInterval(() => {
      const { currentStepIndex: idx, steps: allSteps } = useNavigationStore.getState();
      if (idx < allSteps.length - 1) {
        nextStep();
      } else {
        toggleSimulation(); // Stop at destination
        if (globalVoiceTracker.isEnabled()) {
          globalVoiceTracker.speak('You have arrived at your destination.');
        }
      }
    }, 3200);

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
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 p-4 transition-all animate-in fade-in slide-in-from-top-4 duration-300">
        {/* Top bar: icon + instruction + close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-600/30">
              {turnIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  Auto-Reroute Active
                </span>
              </div>
              <div className="text-sm md:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {currentStep.text}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {currentStep.instruction}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={clearRoute}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold"
            title="Exit Navigation"
          >
            ✕
          </button>
        </div>

        {/* Route Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full my-3 overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
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
                ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white'
            }`}
          >
            ◀ Prev Step
          </button>

          <button
            type="button"
            onClick={toggleSimulation}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow ${
              isSimulating
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100'
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
                ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
            }`}
          >
            Next Step ▶
          </button>
        </div>

        {/* Distance & Time summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Total Distance: <strong className="text-slate-800 dark:text-slate-200">{distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} m`}</strong></span>
          <span>Est. Walk: <strong className="text-slate-800 dark:text-slate-200">{Math.max(1, Math.round(distance / (routeType === 'pedestrian' ? 80 : 250)))} min</strong></span>
        </div>
      </div>
    </div>
  );
}
