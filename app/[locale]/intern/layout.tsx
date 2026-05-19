import { logoutInternAction } from "@/actions/intern";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default async function InternLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <ServiceLogo />
          QA Assessment
        </div>
        <nav className="nav-row">
          <ThemeToggle />
          <form action={logoutInternAction}>
            <input name="locale" type="hidden" value={locale} />
            <Button variant="outline" size="sm" type="submit">
              Выйти
            </Button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
