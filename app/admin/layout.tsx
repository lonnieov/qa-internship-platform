import { UserButton } from "@clerk/nextjs";
import { logoutDemoAdminAction } from "@/actions/demo-admin";
import { requireAdmin } from "@/lib/auth";
import { isDemoAdminProfile } from "@/lib/demo-admin-auth";
import {
  CoinAdminSidebar,
  CoinSidebarLogoutButton,
} from "@/components/layout/coin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  const adminName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Администратор";

  return (
    <div className="coin-admin-shell">
      <CoinAdminSidebar
        active="dashboard"
        adminName={adminName}
        onLogout={
          isDemoAdminProfile(profile) ? (
            <form action={logoutDemoAdminAction}>
              <button className="coin-sidebar-logout-button" type="submit">
                <CoinSidebarLogoutButton />
              </button>
            </form>
          ) : (
            <UserButton />
          )
        }
      />
      <div className="coin-admin-shell__content">{children}</div>
    </div>
  );
}
