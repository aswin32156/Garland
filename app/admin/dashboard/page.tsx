import { getAllGarlandsAdmin } from '@/lib/garlands';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const garlands = await getAllGarlandsAdmin();
  return <AdminDashboardView initialGarlands={garlands} />;
}
