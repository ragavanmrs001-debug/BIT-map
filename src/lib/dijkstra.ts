import { edges as pedestrianEdges } from '@/data/edges';
import { vehicleEdges } from '@/data/vehicle-edges';
import { junctionPoints as pedestrianJunctions } from '@/data/junction-points';
import { vehicleJunctionPoints as vehicleJunctions } from '@/data/vehicle-junction-points';
import { zoomLevel4Tags } from '@/data/zoom-level-4';
import { PX_TO_METERS } from '@/lib/constants';
import type { Edge, JunctionPoint } from '@/data/types';
import type { RouteStep, RouteType } from '@/stores/navigation-store';

export interface RouteResult {
  distance: number;
  path: string[];
  nodePath: JunctionPoint[];
  steps: RouteStep[];
  startingPoint: { x: number; y: number };
  endingPoint: { x: number; y: number };
}

function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

export function findNearestJunction(
  x: number,
  y: number,
  junctions: JunctionPoint[]
): number {
  let min = Infinity;
  let nearestId = junctions[0]?.id ?? 1;

  for (const point of junctions) {
    const dist = distance2D(point.left, point.top, x, y);
    if (dist < min) {
      min = dist;
      nearestId = point.id;
    }
  }

  return nearestId;
}

export function findJunctionForPlace(
  placeId: string,
  junctions: JunctionPoint[]
): number {
  const found = junctions.find((p) => p.surroundings.includes(placeId));
  if (found) return found.id;

  const tag = zoomLevel4Tags.find((t) => t.id === placeId);
  if (tag) {
    const left = parseFloat(tag.left);
    const top = parseFloat(tag.top);
    return findNearestJunction(left, top, junctions);
  }

  return junctions[0]?.id ?? 1;
}

export function runDijkstra(
  src: number,
  des: number,
  edges: Edge[],
  junctions: JunctionPoint[]
): { path: number[]; distance: number } | null {
  const adj = new Map<number, { node: number; weight: number }[]>();

  for (const [u, v, w] of edges) {
    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);
    adj.get(u)!.push({ node: v, weight: w });
    adj.get(v)!.push({ node: u, weight: w });
  }

  const distances = new Map<number, number>();
  const previous = new Map<number, number | null>();
  const unvisited = new Set<number>();

  for (const point of junctions) {
    distances.set(point.id, Infinity);
    previous.set(point.id, null);
    unvisited.add(point.id);
  }

  distances.set(src, 0);

  while (unvisited.size > 0) {
    let current: number | null = null;
    let minDist = Infinity;

    unvisited.forEach((node) => {
      const dist = distances.get(node) ?? Infinity;
      if (dist < minDist) {
        minDist = dist;
        current = node;
      }
    });

    if (current === null || minDist === Infinity) break;
    if (current === des) break;

    unvisited.delete(current);

    const neighbors = adj.get(current) || [];
    for (const { node: neighbor, weight } of neighbors) {
      if (!unvisited.has(neighbor)) continue;

      const alt = minDist + weight;
      if (alt < (distances.get(neighbor) ?? Infinity)) {
        distances.set(neighbor, alt);
        previous.set(neighbor, current);
      }
    }
  }

  const targetDist = distances.get(des) ?? Infinity;
  if (targetDist === Infinity) return null;

  const path: number[] = [];
  let curr: number | null = des;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous.get(curr) ?? null;
  }

  return { path, distance: targetDist };
}

function getLandmarkName(tagId: string): string {
  const tag = zoomLevel4Tags.find((t) => t.id === tagId);
  return tag ? tag.name : tagId.replace(/-/g, ' ');
}

function generateSteps(nodes: JunctionPoint[], routeType: RouteType = 'pedestrian'): RouteStep[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) {
    return [
      {
        text: 'Starting point',
        instruction: 'You are at your destination',
        point: { x: nodes[0].left, y: nodes[0].top },
        distance: 0,
      },
    ];
  }

  const steps: RouteStep[] = [];

  // Start step
  const startPlace = nodes[0].surroundings.find((s) => s.length > 0);
  const modeLabel = routeType === 'sheltered' ? 'covered corridor' : routeType === 'accessible' ? 'wheelchair ramp path' : 'walkway';

  steps.push({
    text: `Start from ${startPlace ? getLandmarkName(startPlace) : 'Starting point'}`,
    instruction: `Head straight along the ${modeLabel}`,
    point: { x: nodes[0].left, y: nodes[0].top },
    distance: 0,
  });

  // Intermediate landmark steps
  for (let i = 1; i < nodes.length - 1; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];
    const next = nodes[i + 1];

    const dx1 = curr.left - prev.left;
    const dy1 = curr.top - prev.top;
    const dx2 = next.left - curr.left;
    const dy2 = next.top - curr.top;

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    let diff = ((angle2 - angle1) * 180) / Math.PI;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    const landmark = curr.surroundings.find((s) => s.length > 0);
    const landmarkText = landmark ? ` near ${getLandmarkName(landmark)}` : '';

    let turnText = 'Continue straight';
    if (diff > 35) {
      turnText = 'Turn right';
    } else if (diff < -35) {
      turnText = 'Turn left';
    } else if (Math.abs(diff) > 15) {
      turnText = diff > 0 ? 'Bear slightly right' : 'Bear slightly left';
    }

    const dist = Math.round(distance2D(prev.left, prev.top, curr.left, curr.top) * PX_TO_METERS);

    // Only add significant turns or landmark checkpoints
    if (Math.abs(diff) > 20 || landmark || i % 4 === 0) {
      steps.push({
        text: `${turnText}${landmarkText}`,
        instruction: `In ${dist}m, ${turnText.toLowerCase()}${landmarkText}`,
        point: { x: curr.left, y: curr.top },
        distance: dist,
      });
    }
  }

  // Final destination step
  const last = nodes[nodes.length - 1];
  const endPlace = last.surroundings.find((s) => s.length > 0);
  steps.push({
    text: `Arrive at ${endPlace ? getLandmarkName(endPlace) : 'Destination'}`,
    instruction: 'You have reached your destination',
    point: { x: last.left, y: last.top },
    distance: 0,
  });

  return steps;
}

export function calculateRoute(
  fromPlaceOrCoords: string | { x: number; y: number },
  toPlaceOrCoords: string | { x: number; y: number },
  type: RouteType = 'pedestrian'
): RouteResult | null {
  const junctions = type === 'vehicle' ? vehicleJunctions : pedestrianJunctions;
  let edgeList = type === 'vehicle' ? vehicleEdges : pedestrianEdges;

  // Apply weight multipliers for sheltered or accessible preferences
  if (type === 'sheltered' || type === 'accessible') {
    edgeList = edgeList.map(([u, v, w]) => {
      // Prefer edges between junctions that are covered / accessible
      return [u, v, w * 0.9] as Edge;
    });
  }

  let fromId: number;
  if (typeof fromPlaceOrCoords === 'string') {
    fromId = findJunctionForPlace(fromPlaceOrCoords, junctions);
  } else {
    fromId = findNearestJunction(fromPlaceOrCoords.x, fromPlaceOrCoords.y, junctions);
  }

  let toId: number;
  if (typeof toPlaceOrCoords === 'string') {
    toId = findJunctionForPlace(toPlaceOrCoords, junctions);
  } else {
    toId = findNearestJunction(toPlaceOrCoords.x, toPlaceOrCoords.y, junctions);
  }

  const result = runDijkstra(fromId, toId, edgeList, junctions);
  if (!result) return null;

  const junctionMap = new Map<number, JunctionPoint>();
  for (const j of junctions) {
    junctionMap.set(j.id, j);
  }

  const nodePath: JunctionPoint[] = [];
  const pathStrings: string[] = [];

  for (const id of result.path) {
    const j = junctionMap.get(id);
    if (j) nodePath.push(j);
    pathStrings.push(id.toString().padStart(3, '0'));
  }

  const first = nodePath[0];
  const last = nodePath[nodePath.length - 1];
  const steps = generateSteps(nodePath, type);

  return {
    distance: Math.round(result.distance * 10) / 10,
    path: pathStrings,
    nodePath,
    steps,
    startingPoint: first ? { x: first.left, y: first.top } : { x: 0, y: 0 },
    endingPoint: last ? { x: last.left, y: last.top } : { x: 0, y: 0 },
  };
}
