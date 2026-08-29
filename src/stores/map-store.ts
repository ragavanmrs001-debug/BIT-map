import { create } from 'zustand';

export type ViewMode = '2d' | '3d-satellite' | '3d-globe';
export type ThemeMode = 'light' | 'dark';

interface MapState {
  // Theme
  theme: ThemeMode;

  // View Mode (2D / 3D Satellite / 3D Globe)
  viewMode: ViewMode;

  // Zoom (for 2D)
  zoomLevel: number;

  // Layer (for 2D)
  activeLayer: 'svg' | 'satellite';

  // Pin
  isPinned: boolean;
  pinX: number;
  pinY: number;

  // Selected & Hovered place
  selectedPlaceId: string | null;
  hoveredPlaceId: string | null;
  showDetails: boolean;

  // Instruction modal
  showInstruction: boolean;

  // Directions & Live GPS Canvas Coordinates
  showDirections: boolean;
  userCanvasPos: { x: number; y: number } | null;
  userGeoPos: { x: number; y: number; lat: number; lng: number; accuracy: number; heading: number | null } | null;

  // Rotation (in degrees 0-360)
  mapRotation: number;

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setZoomLevel: (level: number) => void;
  toggleLayer: () => void;
  setPin: (x: number, y: number) => void;
  clearPin: () => void;
  selectPlace: (id: string) => void;
  setHoveredPlaceId: (id: string | null) => void;
  clearSelection: () => void;
  setShowInstruction: (show: boolean) => void;
  setShowDirections: (show: boolean) => void;
  setUserCanvasPos: (pos: { x: number; y: number } | null) => void;
  setUserGeoPos: (pos: { x: number; y: number; lat: number; lng: number; accuracy: number; heading: number | null } | null) => void;
  setMapRotation: (angle: number | ((prev: number) => number)) => void;
  rotateMapBy: (deltaDegrees: number) => void;
  resetRotation: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  theme: 'light',
  viewMode: '2d',
  zoomLevel: 4,
  activeLayer: 'svg',
  isPinned: false,
  pinX: 0,
  pinY: 0,
  selectedPlaceId: null,
  hoveredPlaceId: null,
  showDetails: false,
  showInstruction: true,
  showDirections: false,
  userCanvasPos: null,
  userGeoPos: null,
  mapRotation: 0,

  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof document !== 'undefined') {
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: nextTheme };
    }),

  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setZoomLevel: (level) => set({ zoomLevel: level }),

  toggleLayer: () =>
    set((state) => ({
      activeLayer: state.activeLayer === 'svg' ? 'satellite' : 'svg',
    })),

  setPin: (x, y) => set({ isPinned: true, pinX: x, pinY: y }),

  clearPin: () => set({ isPinned: false, pinX: 0, pinY: 0 }),

  selectPlace: (id) => set({ selectedPlaceId: id, showDetails: true }),

  setHoveredPlaceId: (id) => set({ hoveredPlaceId: id }),

  clearSelection: () =>
    set({ selectedPlaceId: null, showDetails: false }),

  setShowInstruction: (show) => set({ showInstruction: show }),

  setShowDirections: (show) => set({ showDirections: show }),

  setUserCanvasPos: (pos) => set({ userCanvasPos: pos }),

  setUserGeoPos: (pos) => set({ userGeoPos: pos }),

  setMapRotation: (angle) =>
    set((state) => ({
      mapRotation: typeof angle === 'function' ? angle(state.mapRotation) : angle,
    })),

  rotateMapBy: (deltaDegrees) =>
    set((state) => ({
      mapRotation: (state.mapRotation + deltaDegrees + 360) % 360,
    })),

  resetRotation: () => set({ mapRotation: 0 }),
}));
