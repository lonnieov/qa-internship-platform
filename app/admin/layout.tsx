import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  const adminName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.email ||
    "Администратор";

  return (
    <AdminShell adminName={adminName} adminEmail={profile.email}>
      {children}
    </AdminShell>
  );
}
