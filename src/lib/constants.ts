// Map dimensions and configuration constants
export const MAP_WIDTH = 3420;
export const MAP_HEIGHT = 3876;
export const ZOOM_FACTOR = 1.5;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

// Default view state (matching original GeoBITs)
export const DEFAULT_ZOOM = 4;
export const DEFAULT_SCROLL_LEFT = 1950;
export const DEFAULT_SCROLL_TOP = 1800;

// Pixel-to-meter conversion (from edge_calculator.rb)
export const PX_TO_METERS = 0.28960526315789475;

// Calculate map dimensions for a given zoom level
export function getMapDimensions(level: number): { width: number; height: number } {
  let width = MAP_WIDTH;
  let height = MAP_HEIGHT;
  let i = MAX_ZOOM;
  while (i > level) {
    width /= ZOOM_FACTOR;
    height /= ZOOM_FACTOR;
    i -= 1;
  }
  return { width, height };
}

// Icon paths
export const ICON_BASE_PATH = '/images/icons';
export const MAP_SVG_PATH = '/images/Map.svg';
export const MAP_SATELLITE_PATH = '/images/Map.webp';
export const LOGO_PATH = '/images/logo.svg';
export const PIN_ICON_PATH = '/images/icons/tag.svg';
