'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '@/stores/map-store';
import { buildings } from '@/data/buildings';
import { zoomLevel4Tags } from '@/data/zoom-level-4';
import { MAX_ZOOM } from '@/lib/constants';

interface SearchResult {
  id: string;
  match: string;
  name: string;
  floor: string;
  category?: string;
}

const CATEGORY_PILLS = [
  { label: 'Canteens', query: 'canteen' },
  { label: 'Hostels', query: 'hostel' },
  { label: 'Departments', query: 'block' },
  { label: 'ATMs', query: 'atm' },
  { label: 'Library', query: 'library' },
  { label: 'Sports', query: 'ground' },
  { label: 'Labs', query: 'lab' },
];

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
  const [activePill, setActivePill] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectPlace, setZoomLevel } = useMapStore();

  const handleSearch = (value: string, pillLabel: string | null = null) => {
    setQuery(value);
    setActivePill(pillLabel);
    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const found = searchCampus(value);
    setResults(found);
    setShowResults(true);
  };

  const handlePillClick = (pill: { label: string; query: string }) => {
    if (activePill === pill.label) {
      handleSearch('');
    } else {
      handleSearch(pill.query, pill.label);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');
    setActivePill(null);

    // Find the tag position for the selected result
    const tag = zoomLevel4Tags.find((t) => t.id === result.id);
    if (!tag) return;

    // Zoom to max level
    setZoomLevel(MAX_ZOOM);

    // Scroll to the tag smoothly
    const container = document.querySelector('.bg-map') as HTMLElement;
    if (container) {
      const top = parseFloat(tag.top);
      const left = parseFloat(tag.left);
      container.scrollTo({
        left: left - window.innerWidth / 2,
        top: top - window.innerHeight / 2 + 100,
        behavior: 'smooth',
      });
    }

    // Select the place to show details panel
    setTimeout(() => selectPlace(result.id), 300);
  };

  // Keyboard navigation (Enter / Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      handleSelect(results[0]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
      inputRef.current?.blur();
    }
  };

  // Hide results when clicking outside or scrolling map
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
      <div className="search-wrapper relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-2xl p-1.5 transition-all">
        {/* Search Input Box */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-slate-400 text-base pointer-events-none">🔍</div>
          <input
            ref={inputRef}
            className="search-input pl-10 pr-10 py-2.5 w-full bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            type="text"
            placeholder="Search BIT campus buildings, labs, canteens, hostels..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query && setShowResults(true)}
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center transition-all"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 px-1 scrollbar-none">
          {CATEGORY_PILLS.map((pill) => (
            <button
              key={pill.label}
              type="button"
              onClick={() => handlePillClick(pill)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activePill === pill.label
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search Results Dropdown List */}
        {showResults && results.length > 0 && (
          <div className="suggestions absolute top-full left-0 right-0 mt-2 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-[210] max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
              Campus Locations ({results.length})
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {results.map((result, i) => (
                <li
                  key={`${result.id}-${i}`}
                  onClick={() => handleSelect(result)}
                  className="px-4 py-3 hover:bg-indigo-50/80 dark:hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-sm text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                      {result.match}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {result.floor ? `${result.floor} • ` : ''}
                      {result.name}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Locate →
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty state */}
        {showResults && results.length === 0 && query.trim() && (
          <div className="suggestions absolute top-full left-0 right-0 mt-2 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-center z-[210]">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              No campus location matches "{query}"
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Try searching by building name, block number, or category pill above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
