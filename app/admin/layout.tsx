import { requireAdmin } from "@/lib/auth";
import { isDemoAdminProfile } from "@/lib/demo-admin-auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();

  return (
    <AdminShell isDemoAdmin={isDemoAdminProfile(profile)}>
      {children}
    </AdminShell>
  );
}
