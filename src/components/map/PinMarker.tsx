'use client';

import React, { useRef, useState } from 'react';
import { useMapStore } from '@/stores/map-store';
import { PIN_ICON_PATH } from '@/lib/constants';

export default function PinMarker() {
  const { isPinned, pinX, pinY, zoomLevel, mapRotation } = useMapStore();
  const urlRef = useRef<HTMLInputElement>(null);
  const [copyText, setCopyText] = useState('Copy');

  if (!isPinned) return null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}?pin=true&level=${zoomLevel}&left=${Math.round(pinX)}&top=${Math.round(pinY)}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyText('Copied!');
      setTimeout(() => setCopyText('Copy'), 2000);
    } catch {
      if (urlRef.current) {
        urlRef.current.select();
        document.execCommand('copy');
        setCopyText('Copied!');
        setTimeout(() => setCopyText('Copy'), 2000);
      }
    }
  };

  return (
    <>
      {/* Pin icon */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="pin"
        src={PIN_ICON_PATH}
        alt="pin-point"
        style={{
          display: 'block',
          left: `${pinX - 16}px`,
          top: `${pinY - 36}px`,
          transform: mapRotation !== 0 ? `rotate(${-mapRotation}deg)` : undefined,
          transformOrigin: 'bottom center',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* URL copy box */}
      <div
        className="url-box"
        style={{
          display: 'block',
          left: `${pinX}px`,
          top: `${pinY + 2}px`,
          transform: mapRotation !== 0 ? `translateX(-50%) rotate(${-mapRotation}deg)` : 'translateX(-50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="url-container">
          <input
            ref={urlRef}
            className="pin-url"
            value={shareUrl}
            readOnly
          />
          <button className="copy-btn" onClick={handleCopy}>
            {copyText}
          </button>
        </div>
      </div>
    </>
  );
}
