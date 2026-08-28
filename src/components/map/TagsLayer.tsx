'use client';

import React from 'react';
import { useMapStore } from '@/stores/map-store';

// Dynamic imports for zoom level data
import { zoomLevel1Tags } from '@/data/zoom-level-1';
import { zoomLevel2Tags } from '@/data/zoom-level-2';
import { zoomLevel3Tags } from '@/data/zoom-level-3';
import { zoomLevel4Tags } from '@/data/zoom-level-4';

const tagsByLevel: Record<number, typeof zoomLevel4Tags> = {
  1: zoomLevel1Tags,
  2: zoomLevel2Tags,
  3: zoomLevel3Tags,
  4: zoomLevel4Tags,
};

export default React.memo(function TagsLayer() {
  const { zoomLevel, selectPlace, mapRotation } = useMapStore();

  const tags = tagsByLevel[zoomLevel] || [];

  return (
    <div className="tags pointer-events-none absolute inset-0 z-[110]">
      {tags.map((tag) => (
        <div
          key={tag.id}
          id={tag.id}
          style={{
            top: tag.top,
            left: tag.left,
            transform: mapRotation !== 0 ? `translate(-50%, -50%) rotate(${-mapRotation}deg)` : 'translate(-50%, -50%)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            selectPlace(tag.id);
          }}
          className="absolute pointer-events-auto cursor-pointer px-2 py-0.5 rounded-md text-[11px] font-bold tracking-tight text-slate-800 bg-white/92 dark:bg-slate-900/92 dark:text-slate-100 shadow-md border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-sm hover:scale-110 hover:z-[130] hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all duration-150 whitespace-nowrap"
        >
          {tag.name}
        </div>
      ))}
    </div>
  );
});
