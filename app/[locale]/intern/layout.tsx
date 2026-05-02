import { logoutInternAction } from "@/actions/intern";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
