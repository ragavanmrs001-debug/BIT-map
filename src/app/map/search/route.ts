import { NextResponse } from 'next/server';
import { buildings } from '@/data/buildings';
import { zoomLevel4Tags } from '@/data/zoom-level-4';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') || '').trim().toLowerCase();

  if (!query) {
    return NextResponse.json([]);
  }

  const results: { id: string; match: string; name: string; floor: string }[] = [];

  // Search buildings
  for (const b of buildings) {
    for (const term of b.terms) {
      if (term.toLowerCase().includes(query)) {
        results.push({
          id: b.id,
          match: term,
          name: b.name,
          floor: b.main,
        });
        break;
      }
    }

    if (b.name.toLowerCase().includes(query)) {
      if (!results.find((r) => r.id === b.id)) {
        results.push({
          id: b.id,
          match: b.name,
          name: b.name,
          floor: b.main,
        });
      }
    }

    for (const floor of b.floors) {
      for (const room of floor.rooms) {
        if (room.toLowerCase().includes(query)) {
          results.push({
            id: b.id,
            match: room,
            name: b.name,
            floor: floor.name,
          });
        }
      }
    }
  }

  // Search tags
  for (const tag of zoomLevel4Tags) {
    if (tag.name.toLowerCase().includes(query)) {
      if (!results.find((r) => r.id === tag.id)) {
        results.push({
          id: tag.id,
          match: tag.name,
          name: tag.name,
          floor: '',
        });
      }
    }
  }

  results.sort((a, b) => {
    const idxA = a.match.toLowerCase().indexOf(query);
    const idxB = b.match.toLowerCase().indexOf(query);
    return idxA - idxB;
  });

  return NextResponse.json(results.slice(0, 20));
}
