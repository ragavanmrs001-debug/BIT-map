import { NextResponse } from 'next/server';
import { zoomLevel4Tags } from '@/data/zoom-level-4';

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  const tag = zoomLevel4Tags.find((t) => t.id === id);

  if (!tag) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: tag.id,
    top: tag.top,
    left: tag.left,
    name: tag.name,
  });
}
