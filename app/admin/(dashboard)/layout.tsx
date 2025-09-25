import { requireAdmin } from '@/lib/admin/auth';
import MobileSidebar from '@/components/admin/layout/MobileSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <MobileSidebar />
      <div className="flex-1 flex flex-col lg:ml-0">
        <AdminHeader user={session.user} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}