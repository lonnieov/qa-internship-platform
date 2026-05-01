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
import { useLocale, useTranslations } from "next-intl";
import { logoutAdminAction } from "@/actions/admin-auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type AdminShellProps = {
  children: React.ReactNode;
  adminName: string;
  adminEmail: string | null;
};

const navItems = [
  { href: "/admin", labelKey: "overview", icon: BarChart3, exact: true },
  { href: "/admin/interns", labelKey: "interns", icon: UsersRound },
  { href: "/admin/questions", labelKey: "questions", icon: ListChecks },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
];

export function AdminShell({
  children,
  adminName,
  adminEmail,
}: AdminShellProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("AdminShell");
  const pathnameWithoutLocale = pathname.replace(/^\/(ru|uz)(?=\/|$)/, "") || "/";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-sidebar-brand" href={`/${locale}/admin`}>
          <ServiceLogo />
          <span>
            <strong>{t("brand")}</strong>
            <small>{t("tagline")}</small>
          </span>
        </Link>

        <nav className="admin-sidebar-nav" aria-label="Админ навигация">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathnameWithoutLocale === item.href
              : pathnameWithoutLocale.startsWith(item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`admin-nav-item ${active ? "active" : ""}`}
                href={`/${locale}${item.href}`}
                key={item.href}
              >
                <Icon size={18} />
                <span>{t(`nav.${item.labelKey}`)}</span>
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
          <LanguageSwitcher />
          <ThemeToggle />
          <form action={logoutAdminAction}>
            <Button
              className="w-full justify-start"
              variant="ghost"
              type="submit"
            >
              <LogOut size={16} />
              {t("logout")}
            </Button>
          </form>
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
