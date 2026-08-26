'use client';

import React, { useEffect, useState } from 'react';
import { useMapStore } from '@/stores/map-store';

export default function InstructionModal() {
  const { showInstruction, setShowInstruction } = useMapStore();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto dismiss after 8 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setShowInstruction(false), 500);
    }, 8000);

    return () => clearTimeout(timer);
  }, [setShowInstruction]);

  if (!showInstruction) return null;

  return (
    <div className="instruct-box" style={{ opacity: visible ? 1 : 0, transition: 'opacity 1s' }}>
      <div className="instruction">
        <div className="notes">
          <p>Press or hold at any place in the map to pin point that location and share it with the url.</p>
          <p>Each classes and labs in every building are indexed and can be searched via search bar.</p>
          <p>Use the zoom buttons or double tap the map to zoom in or zoom out.</p>
          <hr />
          <p className="last-info">Click the info button for more info!</p>
        </div>
        <span
          className="close-btn"
          onClick={() => setShowInstruction(false)}
        >
          X
        </span>
      </div>
    </div>
  );
}
