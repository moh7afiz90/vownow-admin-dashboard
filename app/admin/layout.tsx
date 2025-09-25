import { requireAdmin } from '@/lib/admin/auth';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if this is the login page route
  // We can't check the pathname directly in server components,
  // so we'll handle auth in each protected page instead
  return <>{children}</>;
}