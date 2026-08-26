import { NextResponse } from 'next/server';
import { calculateRoute } from '@/lib/dijkstra';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const type = (searchParams.get('type') || 'pedestrian') as 'pedestrian' | 'vehicle';

  let fromArg: string | { x: number; y: number } = from;
  if (from === 'my-location') {
    fromArg = {
      x: parseInt(searchParams.get('my-left') || '0', 10),
      y: parseInt(searchParams.get('my-top') || '0', 10),
    };
  } else if (from === 'pinned-location') {
    fromArg = {
      x: parseInt(searchParams.get('pin-left') || '0', 10),
      y: parseInt(searchParams.get('pin-top') || '0', 10),
    };
  }

  let toArg: string | { x: number; y: number } = to;
  if (to === 'my-location') {
    toArg = {
      x: parseInt(searchParams.get('my-left') || '0', 10),
      y: parseInt(searchParams.get('my-top') || '0', 10),
    };
  } else if (to === 'pinned-location') {
    toArg = {
      x: parseInt(searchParams.get('pin-left') || '0', 10),
      y: parseInt(searchParams.get('pin-top') || '0', 10),
    };
  }

  const route = calculateRoute(fromArg, toArg, type);
  if (!route) {
    return NextResponse.json({ error: 'No route found' }, { status: 404 });
  }

  return NextResponse.json({
    distance: route.distance,
    path: route.path,
    'starting-point': route.startingPoint,
    'ending-point': route.endingPoint,
  });
}
