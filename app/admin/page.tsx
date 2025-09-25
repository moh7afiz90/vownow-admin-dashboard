import { requireAdmin } from '@/lib/admin/auth';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import DashboardClient from './DashboardClient';

export default async function AdminPage() {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader user={session.user} />
        <main className="flex-1 p-6 overflow-y-auto">
          <DashboardClient />
        </main>
      </div>
    </div>
  );
}