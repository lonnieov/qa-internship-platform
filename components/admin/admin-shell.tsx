"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  ListChecks,
  LogOut,
  Settings,
  UsersRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { logoutDemoAdminAction } from "@/actions/demo-admin";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type AdminShellProps = {
  children: React.ReactNode;
  isDemoAdmin: boolean;
};

const navItems = [
  { href: "/admin", label: "Обзор", icon: BarChart3, exact: true },
  { href: "/admin/interns", label: "Стажёры", icon: UsersRound },
  { href: "/admin/questions", label: "Вопросы", icon: ListChecks },
  { href: "/admin/settings", label: "Настройки теста", icon: Settings },
];

export function AdminShell({ children, isDemoAdmin }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-sidebar-brand" href="/admin">
          <ServiceLogo />
          <span>
            <strong>Coin</strong>
            <small>Assessment</small>
          </span>
        </Link>

        <nav className="admin-sidebar-nav" aria-label="Админ навигация">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`admin-nav-item ${active ? "active" : ""}`}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <ThemeToggle />
          {isDemoAdmin ? (
            <form action={logoutDemoAdminAction}>
              <Button
                className="w-full justify-start"
                variant="ghost"
                type="submit"
              >
                <LogOut size={16} />
                Выйти
              </Button>
            </form>
          ) : (
            <UserButton />
          )}
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
