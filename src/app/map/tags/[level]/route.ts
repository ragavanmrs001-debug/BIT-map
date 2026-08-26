import { NextResponse } from 'next/server';
import { zoomLevel1Tags } from '@/data/zoom-level-1';
import { zoomLevel2Tags } from '@/data/zoom-level-2';
import { zoomLevel3Tags } from '@/data/zoom-level-3';
import { zoomLevel4Tags } from '@/data/zoom-level-4';

const tagsByLevel: Record<string, typeof zoomLevel4Tags> = {
  '1': zoomLevel1Tags,
  '2': zoomLevel2Tags,
  '3': zoomLevel3Tags,
  '4': zoomLevel4Tags,
};

export async function GET(
  request: Request,
  { params }: { params: { level: string } | Promise<{ level: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const level = resolvedParams.level;
  const tags = tagsByLevel[level] || zoomLevel4Tags;
  return NextResponse.json({ tags });
}
