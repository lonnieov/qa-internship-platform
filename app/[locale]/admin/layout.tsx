import { cookies } from "next/headers";
import { requireAdminAccess } from "@/lib/auth";
import { ADMIN_SIDEBAR_COLLAPSED_COOKIE } from "@/lib/admin-sidebar";
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
  // Read on the server so the collapsed sidebar renders without a flash of the
  // expanded layout on first paint.
  const cookieStore = await cookies();
  const sidebarCollapsed =
    cookieStore.get(ADMIN_SIDEBAR_COLLAPSED_COOKIE)?.value === "1";

  return (
    <AdminShell
      adminName={adminName}
      adminEmail={profile.email}
      role={profile.role}
      defaultCollapsed={sidebarCollapsed}
    >
      {children}
    </AdminShell>
  );
}
