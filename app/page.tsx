import { getLiveGarlands } from '@/lib/garlands';
import { HomeView } from '@/components/home/HomeView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const garlands = await getLiveGarlands();
  return <HomeView initialGarlands={garlands} />;
}
