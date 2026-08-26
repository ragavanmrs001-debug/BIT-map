'use client';

import React from 'react';
import { useNavigationStore } from '@/stores/navigation-store';
import { useMapStore } from '@/stores/map-store';
import { getMapDimensions, MAX_ZOOM, ZOOM_FACTOR } from '@/lib/constants';

export default function RouteOverlay() {
  const { zoomLevel } = useMapStore();
  const { isActive, nodeCoordinates, steps, currentStepIndex } = useNavigationStore();

  if (!isActive || nodeCoordinates.length < 2) return null;

  const { width, height } = getMapDimensions(zoomLevel);
  const scale = 1 / Math.pow(ZOOM_FACTOR, MAX_ZOOM - zoomLevel);

  const scaledPoints = nodeCoordinates.map((pt) => ({
    x: pt.x * scale,
    y: pt.y * scale,
  }));

  const pointsString = scaledPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');

  const startPt = scaledPoints[0];
  const endPt = scaledPoints[scaledPoints.length - 1];

  const activeStep = steps[currentStepIndex];
  const activePt = activeStep?.point
    ? {
        x: activeStep.point.x * scale,
        y: activeStep.point.y * scale,
      }
    : null;

  return (
    <svg
      className="route-line"
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 106,
      }}
    >
      <defs>
        <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Glow */}
      <polyline
        points={pointsString}
        fill="none"
        stroke="#7B68EE"
        strokeWidth="10"
        strokeOpacity="0.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Base Line */}
      <polyline
        points={pointsString}
        fill="none"
        stroke="#7B68EE"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Animated Dash */}
      <polyline
        points={pointsString}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeDasharray="8 8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="32"
          to="0"
          dur="1s"
          repeatCount="indefinite"
        />
      </polyline>

      {/* Start Point */}
      {startPt && (
        <g>
          <circle cx={startPt.x} cy={startPt.y} r="8" fill="#10B981" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx={startPt.x} cy={startPt.y} r="3" fill="#ffffff" />
        </g>
      )}

      {/* End Point */}
      {endPt && (
        <g>
          <circle cx={endPt.x} cy={endPt.y} r="9" fill="#EF4444" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx={endPt.x} cy={endPt.y} r="3.5" fill="#ffffff" />
        </g>
      )}

      {/* Google Maps-style Active Step Live Pulse Marker */}
      {activePt && (
        <g className="transition-all duration-500">
          {/* Radar ripple */}
          <circle cx={activePt.x} cy={activePt.y} r="8" fill="#3B82F6" opacity="0.4">
            <animate attributeName="r" from="8" to="28" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="1.6s" repeatCount="indefinite" />
          </circle>
          {/* Blue Live Dot */}
          <circle
            cx={activePt.x}
            cy={activePt.y}
            r="10"
            fill="#2563EB"
            stroke="#ffffff"
            strokeWidth="3"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}
          />
          <circle cx={activePt.x} cy={activePt.y} r="4" fill="#ffffff" />
        </g>
      )}
    </svg>
  );
}
