'use client';

import React, { useState } from 'react';
import { buildings } from '@/data/buildings';

interface FloorPlanModalProps {
  buildingId: string | null;
  onClose: () => void;
}

export default function FloorPlanModal({ buildingId, onClose }: FloorPlanModalProps) {
  const [activeFloorIdx, setActiveFloorIdx] = useState(0);
  const [filterQuery, setFilterQuery] = useState('');

  if (!buildingId) return null;
  const building = buildings.find((b) => b.id === buildingId);
  if (!building || building.floors.length === 0) return null;

  const currentFloor = building.floors[activeFloorIdx] || building.floors[0];

  const filteredRooms = currentFloor.rooms.filter((r) =>
    r.toLowerCase().includes(filterQuery.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏢</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {building.name} — Floor Schematic
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {building.main} • Multi-Level Floor Layout Explorer
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-500 hover:text-white flex items-center justify-center font-bold text-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Floor Selection Tabs & Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-900">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {building.floors.map((floor, idx) => (
              <button
                key={floor.name}
                onClick={() => {
                  setActiveFloorIdx(idx);
                  setFilterQuery('');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  idx === activeFloorIdx
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {floor.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Search room or lab on floor..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
          </div>
        </div>

        {/* Interactive Schematic Diagram View */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/60 min-h-[300px]">
          {/* Schematic SVG Map Box */}
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 rounded-2xl p-6 shadow-xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {currentFloor.name} Layout ({filteredRooms.length} rooms)
              </span>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  🚪 Exit North
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                  🛗 Elevator
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                  🪜 Stairs
                </span>
              </div>
            </div>

            {/* Room Grid Cells */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredRooms.map((room, rIdx) => (
                <div
                  key={rIdx}
                  className="p-3 bg-indigo-50/60 dark:bg-slate-800/80 border border-indigo-200/70 dark:border-slate-700/80 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-400 transition-all group cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                      {room}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                      #{rIdx + 1}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Wing {rIdx % 2 === 0 ? 'A (North)' : 'B (South)'}
                  </div>
                </div>
              ))}
            </div>

            {filteredRooms.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No rooms match "{filterQuery}" on {currentFloor.name}.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/40">
          <span>BIT Erode Interactive Building Schematic Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
          >
            Done Viewing
          </button>
        </div>
      </div>
    </div>
  );
}
