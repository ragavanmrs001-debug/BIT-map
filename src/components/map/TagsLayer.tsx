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

export default function TagsLayer() {
  const { zoomLevel, selectPlace } = useMapStore();

  const tags = tagsByLevel[zoomLevel] || [];

  return (
    <div className="tags">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="tag"
          id={tag.id}
          style={{ top: tag.top, left: tag.left }}
          onClick={(e) => {
            e.stopPropagation();
            selectPlace(tag.id);
          }}
        >
          {tag.name}
        </div>
      ))}
    </div>
  );
}
