import Link from "next/link";
import { CircleCheckBig } from "lucide-react";
import { logoutInternAction } from "@/actions/intern";
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
        <Link className="brand" href="/intern">
          <span className="brand-mark">
            <CircleCheckBig size={17} />
          </span>
          QA Assessment
        </Link>
        <nav className="nav-row">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/intern">Главная</Link>
          </Button>
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
