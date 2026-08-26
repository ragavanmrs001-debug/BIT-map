import { NextResponse } from 'next/server';
import { legends1 } from '@/data/legends-1';
import { legends2 } from '@/data/legends-2';
import { legends3 } from '@/data/legends-3';
import { legends4 } from '@/data/legends-4';

const legendsByLevel: Record<string, any[]> = {
  '1': legends1,
  '2': legends2,
  '3': legends3,
  '4': legends4,
};

export async function GET(
  request: Request,
  { params }: { params: { level: string } | Promise<{ level: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const level = resolvedParams.level;
  const list = legendsByLevel[level] || legends4;
  const result = list.map((item) => ({
    id: item.id,
    link: `/images/icons/${item.icon}`,
    top: item.top,
    left: item.left,
  }));
  return NextResponse.json(result);
}
