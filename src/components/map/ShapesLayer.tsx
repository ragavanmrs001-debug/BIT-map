'use client';

import React from 'react';
import { useMapStore } from '@/stores/map-store';
import { campusShapes } from '@/data/shapes';
import { getMapDimensions, MAX_ZOOM, ZOOM_FACTOR } from '@/lib/constants';

const categoryColors: Record<string, { fill: string; stroke: string; glow: string }> = {
  academic: { fill: 'rgba(123, 104, 238, 0.25)', stroke: '#7B68EE', glow: 'rgba(123, 104, 238, 0.6)' },
  hostel: { fill: 'rgba(59, 130, 246, 0.25)', stroke: '#3B82F6', glow: 'rgba(59, 130, 246, 0.6)' },
  sports: { fill: 'rgba(16, 185, 129, 0.25)', stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.6)' },
  food: { fill: 'rgba(245, 158, 11, 0.25)', stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)' },
  admin: { fill: 'rgba(236, 72, 153, 0.25)', stroke: '#EC4899', glow: 'rgba(236, 72, 153, 0.6)' },
  facility: { fill: 'rgba(6, 182, 212, 0.25)', stroke: '#06B6D4', glow: 'rgba(6, 182, 212, 0.6)' },
  footpath: { fill: 'rgba(52, 211, 153, 0.15)', stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.5)' },
  entrance: { fill: 'rgba(244, 63, 94, 0.3)', stroke: '#F43F5E', glow: 'rgba(244, 63, 94, 0.7)' },
  restroom: { fill: 'rgba(99, 102, 241, 0.35)', stroke: '#6366F1', glow: 'rgba(99, 102, 241, 0.8)' },
};

export default React.memo(function ShapesLayer() {
  const { zoomLevel, selectedPlaceId, selectPlace } = useMapStore();

  const { width, height } = getMapDimensions(zoomLevel);
  const scale = 1 / Math.pow(ZOOM_FACTOR, MAX_ZOOM - zoomLevel);

  return (
    <svg
      className="campus-shapes-layer"
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 104,
      }}
    >
      {campusShapes.map((shape) => {
        const isSelected = selectedPlaceId === shape.id;
        const colors = categoryColors[shape.category] || categoryColors.academic;

        const scaledPoints = shape.points
          .map(([x, y]) => `${x * scale},${y * scale}`)
          .join(' ');

        const centerX = shape.center[0] * scale;
        const centerY = shape.center[1] * scale;

        return (
          <g
            key={shape.id}
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              selectPlace(shape.id);
            }}
            className="group"
          >
            {/* Building Polygon Shape */}
            <polygon
              points={scaledPoints}
              fill={isSelected ? colors.fill : 'rgba(123, 104, 238, 0.08)'}
              stroke={isSelected ? '#ffffff' : colors.stroke}
              strokeWidth={isSelected ? 3.5 : 1.5}
              strokeDasharray={isSelected ? 'none' : '4 2'}
              strokeOpacity={isSelected ? 1 : 0.45}
              className="transition-colors duration-150 group-hover:fill-indigo-500/25 group-hover:stroke-indigo-500 group-hover:stroke-opacity-100"
            />

            {/* Center Label Pill on select */}
            {isSelected && (
              <g transform={`translate(${centerX}, ${centerY - 10})`}>
                <rect
                  x="-65"
                  y="-14"
                  width="130"
                  height="24"
                  rx="12"
                  fill="rgba(15, 23, 42, 0.92)"
                  stroke={colors.stroke}
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="2"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontFamily="'Quicksand', sans-serif"
                  fontWeight="700"
                >
                  {shape.name.length > 16 ? shape.name.slice(0, 15) + '…' : shape.name}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
});
