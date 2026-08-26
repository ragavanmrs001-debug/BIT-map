export interface PlaceTag {
  id: string;
  name: string;
  top: string;
  left: string;
}

export interface LegendIcon {
  id: string;
  icon: string; // just the filename like 'library.svg'
  top: string;
  left: string;
}

export interface BuildingFloor {
  name: string;
  rooms: string[];
}

export interface Building {
  id: string;
  name: string;
  main: string;
  about: string;
  terms: string[];
  floors: BuildingFloor[];
}

export interface JunctionPoint {
  id: number;
  top: number;
  left: number;
  surroundings: string[];
}

export type Edge = [number, number, number]; // [from, to, weight]
