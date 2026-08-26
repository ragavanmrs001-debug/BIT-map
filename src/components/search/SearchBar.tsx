'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '@/stores/map-store';
import { buildings } from '@/data/buildings';
import { zoomLevel4Tags } from '@/data/zoom-level-4';
import { MAX_ZOOM, ZOOM_FACTOR, getMapDimensions } from '@/lib/constants';
import type { Building } from '@/data/types';

interface SearchResult {
  id: string;
  match: string;
  name: string;
  floor: string;
}

function searchCampus(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const q = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  // Search buildings (terms, name)
  for (const building of buildings) {
    // Check building terms
    for (const term of building.terms) {
      const idx = term.toLowerCase().indexOf(q);
      if (idx !== -1) {
        results.push({
          id: building.id,
          match: term,
          name: building.name,
          floor: building.main,
        });
        break;
      }
    }

    // Check building name
    if (building.name.toLowerCase().includes(q)) {
      const already = results.find((r) => r.id === building.id);
      if (!already) {
        results.push({
          id: building.id,
          match: building.name,
          name: building.name,
          floor: building.main,
        });
      }
    }

    // Check rooms in all floors
    for (const floor of building.floors) {
      for (const room of floor.rooms) {
        if (room.toLowerCase().includes(q)) {
          results.push({
            id: building.id,
            match: room,
            name: building.name,
            floor: floor.name,
          });
        }
      }
    }
  }

  // Search tags
  for (const tag of zoomLevel4Tags) {
    if (tag.name.toLowerCase().includes(q)) {
      const already = results.find((r) => r.id === tag.id);
      if (!already) {
        results.push({
          id: tag.id,
          match: tag.name,
          name: tag.name,
          floor: '',
        });
      }
    }
  }

  // Sort by match position (earlier matches first)
  results.sort((a, b) => {
    const idxA = a.match.toLowerCase().indexOf(q);
    const idxB = b.match.toLowerCase().indexOf(q);
    return idxA - idxB;
  });

  return results.slice(0, 20);
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectPlace, setZoomLevel } = useMapStore();

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const found = searchCampus(value);
    setResults(found);
    setShowResults(true);
  };

  const handleSelect = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');

    // Find the tag position for the selected result
    const tag = zoomLevel4Tags.find((t) => t.id === result.id);
    if (!tag) return;

    // Zoom to max level
    setZoomLevel(MAX_ZOOM);

    // Scroll to the tag
    const container = document.querySelector('.bg-map') as HTMLElement;
    if (container) {
      const top = parseFloat(tag.top);
      const left = parseFloat(tag.left);
      container.scrollTop = top - window.innerHeight / 2 + 150;
      container.scrollLeft = left - window.innerWidth / 2;
    }

    // Select the place to show details
    setTimeout(() => selectPlace(result.id), 300);
  };

  // Hide results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowResults(false);
    const bgMap = document.querySelector('.bg-map');
    bgMap?.addEventListener('click', handleClickOutside);
    bgMap?.addEventListener('scroll', handleClickOutside);
    return () => {
      bgMap?.removeEventListener('click', handleClickOutside);
      bgMap?.removeEventListener('scroll', handleClickOutside);
    };
  }, []);

  return (
    <div className="search-bar">
      <div className="search-wrapper dark:bg-slate-900 dark:border dark:border-slate-700 dark:shadow-2xl">
        <input
          ref={inputRef}
          className="search-input dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:placeholder-slate-400"
          type="text"
          placeholder="Search campus buildings, labs, classrooms..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          autoComplete="off"
        />
        {showResults && results.length > 0 && (
          <div className="suggestions">
            <ul className="suggestion-list dark:bg-slate-900 dark:border-t dark:border-slate-800" style={{ display: 'block' }}>
              {results.map((result, i) => (
                <li
                  key={`${result.id}-${i}`}
                  onClick={() => handleSelect(result)}
                  className="dark:hover:bg-slate-800 dark:text-slate-200 transition-colors"
                >
                  <div className="match font-semibold text-primary">{result.match}</div>
                  <div className="building-place dark:text-slate-400">
                    {result.floor ? `${result.floor}, ` : ''}{result.name}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {showResults && results.length === 0 && query.trim() && (
          <div className="suggestions">
            <ul className="suggestion-list dark:bg-slate-900 dark:text-slate-400" style={{ display: 'block' }}>
              <li className="p-4 text-center">No results found</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
