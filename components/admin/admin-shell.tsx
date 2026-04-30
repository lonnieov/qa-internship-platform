"use client";

import Link from "next/link";
import {
  BarChart3,
  ListChecks,
  LogOut,
  Settings,
  UsersRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { logoutAdminAction } from "@/actions/admin-auth";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type AdminShellProps = {
  children: React.ReactNode;
  adminName: string;
  adminEmail: string | null;
};

const navItems = [
  { href: "/admin", label: "Обзор", icon: BarChart3, exact: true },
  { href: "/admin/interns", label: "Стажёры", icon: UsersRound },
  { href: "/admin/questions", label: "Вопросы", icon: ListChecks },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export function AdminShell({
  children,
  adminName,
  adminEmail,
}: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-sidebar-brand" href="/admin">
          <ServiceLogo />
          <span>
            <strong>Click Assessment</strong>
            <small>Never gonna give you up</small>
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
          <div className="admin-user-card">
            <div className="admin-user-avatar">
              {adminName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <strong>{adminName}</strong>
              {adminEmail ? <small>{adminEmail}</small> : null}
            </div>
          </div>
          <ThemeToggle />
          <form action={logoutAdminAction}>
            <Button
              className="w-full justify-start"
              variant="ghost"
              type="submit"
            >
              <LogOut size={16} />
              Выйти
            </Button>
          </form>
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
