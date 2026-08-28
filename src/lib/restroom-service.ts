import { calculateRoute, RouteResult } from '@/lib/dijkstra';
import { METERS_PER_STEP } from '@/lib/voice-tracker';

export interface CampusRestroom {
  id: string;
  name: string;
  building: string;
  x: number;
  y: number;
  gender: 'all' | 'gents' | 'ladies';
  accessible: boolean;
}

export const CAMPUS_RESTROOMS: CampusRestroom[] = [
  {
    id: 'restroom-sf-block',
    name: 'Sunflower Block Restrooms (Ground & 1st Floor)',
    building: 'SF Block',
    x: 2040,
    y: 1950,
    gender: 'all',
    accessible: true,
  },
  {
    id: 'restroom-mech-block',
    name: 'Mechanical Block Restrooms',
    building: 'Mech Block Entrance',
    x: 2020,
    y: 2150,
    gender: 'all',
    accessible: true,
  },
  {
    id: 'restroom-as-block',
    name: 'AS Block Central Restrooms',
    building: 'AS Block',
    x: 1520,
    y: 1835,
    gender: 'all',
    accessible: true,
  },
  {
    id: 'restroom-ib-block',
    name: 'IB Block Academic Restrooms',
    building: 'IB Block (1)',
    x: 1270,
    y: 1820,
    gender: 'all',
    accessible: true,
  },
  {
    id: 'restroom-library',
    name: 'Central Library Washrooms',
    building: 'Library',
    x: 1435,
    y: 2725,
    gender: 'all',
    accessible: true,
  },
  {
    id: 'restroom-canteen',
    name: 'Main Canteen & Food Court Restrooms',
    building: 'Cafeteria',
    x: 1645,
    y: 3005,
    gender: 'all',
    accessible: true,
  },
  {
    id: 'restroom-auditorium',
    name: 'Main Auditorium Restrooms',
    building: 'Main Auditorium',
    x: 1415,
    y: 2560,
    gender: 'all',
    accessible: true,
  },
  {
    id: 'restroom-boys-hostel',
    name: 'Boys Hostel Complex Washrooms',
    building: 'Boys Hostels',
    x: 2525,
    y: 2750,
    gender: 'gents',
    accessible: false,
  },
  {
    id: 'restroom-girls-hostel',
    name: 'Girls Hostel Quad Washrooms',
    building: 'Girls Hostels',
    x: 1005,
    y: 3440,
    gender: 'ladies',
    accessible: true,
  },
];

export interface NearestRestroomResult {
  restroom: CampusRestroom;
  route: RouteResult;
  distanceMeters: number;
  estimatedSteps: number;
  walkingTimeMinutes: number;
}

/**
 * Finds the nearest campus restroom from given map canvas coordinates (x, y)
 * using exact walking network routes computed via Dijkstra's shortest path.
 */
export function findNearestRestroom(
  userX: number,
  userY: number
): NearestRestroomResult | null {
  let bestResult: NearestRestroomResult | null = null;
  let minDistance = Infinity;

  for (const rr of CAMPUS_RESTROOMS) {
    const route = calculateRoute({ x: userX, y: userY }, rr.id, 'pedestrian');
    if (route) {
      const distanceMeters = route.distance;
      if (distanceMeters < minDistance) {
        minDistance = distanceMeters;
        const estimatedSteps = Math.round(distanceMeters / METERS_PER_STEP);
        const walkingTimeMinutes = Math.max(1, Math.round(distanceMeters / 70)); // ~70m per min walk

        bestResult = {
          restroom: rr,
          route,
          distanceMeters,
          estimatedSteps,
          walkingTimeMinutes,
        };
      }
    }
  }

  return bestResult;
}
