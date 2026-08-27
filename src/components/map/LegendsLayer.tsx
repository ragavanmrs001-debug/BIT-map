'use client';

import React from 'react';
import { useMapStore } from '@/stores/map-store';
import { ICON_BASE_PATH } from '@/lib/constants';

// Dynamic imports for legend data
import { legends1 } from '@/data/legends-1';
import { legends2 } from '@/data/legends-2';
import { legends3 } from '@/data/legends-3';
import { legends4 } from '@/data/legends-4';

const legendsByLevel: Record<number, typeof legends4> = {
  1: legends1,
  2: legends2,
  3: legends3,
  4: legends4,
};

export default React.memo(function LegendsLayer() {
  const { zoomLevel } = useMapStore();

  const legends = legendsByLevel[zoomLevel] || [];

  return (
    <div className="legends">
      {legends.map((legend) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={legend.id}
          src={`${ICON_BASE_PATH}/${legend.icon}`}
          className="legend"
          id={legend.id}
          style={{ top: legend.top, left: legend.left }}
          alt={legend.id}
          loading="lazy"
        />
      ))}
    </div>
  );
});
