import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { getTranslations } from "next-intl/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("AdminShell");
  const profile = await requireAdmin();
  const adminName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.email ||
    t("fallbackAdmin");

  return (
    <AdminShell adminName={adminName} adminEmail={profile.email}>
      {children}
    </AdminShell>
  );
}
