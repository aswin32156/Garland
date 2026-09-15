import { Suspense } from 'react';
import { getLiveGarlands } from '@/lib/garlands';
import { GarlandsView } from '@/components/garland/GarlandsView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GarlandsPage() {
  const garlands = await getLiveGarlands();

  return (
    <Suspense fallback={<div className="min-h-screen pt-28 text-center text-gray-400">Loading collection...</div>}>
      <GarlandsView initialGarlands={garlands} />
    </Suspense>
  );
}
