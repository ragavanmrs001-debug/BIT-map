import { NextResponse } from 'next/server';
import { buildings } from '@/data/buildings';
import { zoomLevel4Tags } from '@/data/zoom-level-4';

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  // Check in buildings first
  const building = buildings.find((b) => b.id === id);
  if (building) {
    return NextResponse.json({
      id: building.id,
      name: building.name,
      main: building.main,
      floors: building.floors,
    });
  }

  // Fallback to tags (non-building POIs)
  const tag = zoomLevel4Tags.find((t) => t.id === id);
  if (tag) {
    return NextResponse.json({
      id: tag.id,
      name: tag.name,
      main: tag.name,
      floors: [{ name: 'Ground', rooms: [tag.name] }],
    });
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
