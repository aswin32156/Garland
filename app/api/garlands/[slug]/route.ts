import { NextResponse } from 'next/server';
import { getGarlandBySlug } from '@/lib/garlands';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: Request, ctx: RouteContext<'/api/garlands/[slug]'>) {
  const { slug } = await ctx.params;
  const garland = await getGarlandBySlug(slug);

  if (!garland) {
    return NextResponse.json({ error: 'Garland not found' }, { status: 404 });
  }

  return NextResponse.json(
    { data: garland },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  );
}
