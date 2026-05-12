import { requireAdminAccess } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { getTranslations } from "next-intl/server";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("AdminShell");
  const profile = await requireAdminAccess({ locale });
  const adminName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.email ||
    t("fallbackAdmin");

  return (
    <AdminShell
      adminName={adminName}
      adminEmail={profile.email}
      role={profile.role}
    >
      {children}
    </AdminShell>
  );
}
