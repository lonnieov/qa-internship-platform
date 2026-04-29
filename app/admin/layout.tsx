import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { logoutDemoAdminAction } from "@/actions/demo-admin";
import { requireAdmin } from "@/lib/auth";
import { isDemoAdminProfile } from "@/lib/demo-admin-auth";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/admin">
          <ServiceLogo />
          Admin
        </Link>
        <nav className="nav-row">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/interns">Стажёры</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/questions">Вопросы</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/settings">Настройки</Link>
          </Button>
          <ThemeToggle />
          {isDemoAdminProfile(profile) ? (
            <form action={logoutDemoAdminAction}>
              <Button variant="outline" size="sm" type="submit">
                Выйти
              </Button>
            </form>
          ) : (
            <UserButton />
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
