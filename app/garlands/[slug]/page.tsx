import { notFound } from 'next/navigation';
import { getGarlandBySlug, getLiveGarlands } from '@/lib/garlands';
import { GarlandDetailView } from '@/components/garland/GarlandDetailView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GarlandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const garland = await getGarlandBySlug(slug);

  if (!garland) {
    notFound();
  }

  const allGarlands = await getLiveGarlands();

  return <GarlandDetailView garland={garland} allGarlands={allGarlands} />;
}
