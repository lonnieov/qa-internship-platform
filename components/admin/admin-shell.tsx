"use client";

import type { WheelEvent as ReactWheelEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Layers3,
  ListChecks,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UsersRound,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { logoutAdminAction } from "@/actions/admin-auth";
import {
  ADMIN_SIDEBAR_COLLAPSED_COOKIE,
  ADMIN_SIDEBAR_COOKIE_MAX_AGE,
} from "@/lib/admin-sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type AdminShellProps = {
  children: React.ReactNode;
  adminName: string;
  adminEmail: string | null;
  role: "ADMIN" | "TRACK_MASTER" | "INTERN";
  defaultCollapsed?: boolean;
};

const navItems = [
  { href: "/admin", labelKey: "overview", icon: BarChart3, exact: true },
  { href: "/admin/interns", labelKey: "interns", icon: UsersRound },
  { href: "/admin/tracks", labelKey: "tracks", icon: Layers3 },
  { href: "/admin/questions", labelKey: "questions", icon: ListChecks },
  { href: "/admin/settings", labelKey: "settings", icon: Settings },
];

const SCROLL_EDGE_EPSILON = 1;

function normalizeWheelDeltaY(event: WheelEvent, pageStep: number) {
  if (event.deltaMode === 1) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === 2) {
    return event.deltaY * pageStep;
  }

  return event.deltaY;
}

function getNestedScrollable(
  target: EventTarget | null,
  boundary: HTMLElement,
) {
  if (!(target instanceof Element)) {
    return null;
  }

  let element: Element | null = target;

  while (element && element !== boundary) {
    if (element instanceof HTMLElement) {
      const { overflowY } = window.getComputedStyle(element);
      const isScrollable =
        (overflowY === "auto" || overflowY === "scroll") &&
        element.scrollHeight > element.clientHeight + SCROLL_EDGE_EPSILON;

      if (isScrollable) {
        return element;
      }
    }

    element = element.parentElement;
  }

  return null;
}

function handleAdminContentWheel(event: ReactWheelEvent<HTMLDivElement>) {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey) {
    return;
  }

  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
    return;
  }

  const container = event.currentTarget;
  const nestedScrollable = getNestedScrollable(event.target, container);

  if (nestedScrollable) {
    return;
  }

  const deltaY = normalizeWheelDeltaY(
    event.nativeEvent,
    Math.max(container.clientHeight, 1),
  );

  if (Math.abs(deltaY) <= SCROLL_EDGE_EPSILON) {
    return;
  }

  const maxContainerScroll = Math.max(
    0,
    container.scrollHeight - container.clientHeight,
  );
  const maxPageScroll = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );

  if (deltaY > 0) {
    const remainingContainerScroll = maxContainerScroll - container.scrollTop;
    const remainingPageScroll = maxPageScroll - window.scrollY;

    if (
      remainingPageScroll <= SCROLL_EDGE_EPSILON ||
      remainingContainerScroll >= deltaY - SCROLL_EDGE_EPSILON
    ) {
      return;
    }

    event.preventDefault();
    container.scrollTop = maxContainerScroll;
    window.scrollBy({
      top: deltaY - Math.max(remainingContainerScroll, 0),
      behavior: "auto",
    });
    return;
  }

  const shell = container.closest(".admin-shell");
  const shellTop = shell
    ? shell.getBoundingClientRect().top + window.scrollY
    : 0;
  const pageScrolledPastShell = Math.max(0, window.scrollY - shellTop);

  if (pageScrolledPastShell <= SCROLL_EDGE_EPSILON) {
    return;
  }

  event.preventDefault();

  const upwardDelta = Math.abs(deltaY);
  const pageDelta = Math.min(upwardDelta, pageScrolledPastShell);
  window.scrollBy({
    top: -pageDelta,
    behavior: "auto",
  });

  const remainingDelta = upwardDelta - pageDelta;

  if (remainingDelta > SCROLL_EDGE_EPSILON) {
    container.scrollTop = Math.max(0, container.scrollTop - remainingDelta);
  }
}

export function AdminShell({
  children,
  adminName,
  adminEmail,
  role,
  defaultCollapsed = false,
}: AdminShellProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("AdminShell");
  const pathnameWithoutLocale = pathname.replace(/^\/(ru|uz)(?=\/|$)/, "") || "/";
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${ADMIN_SIDEBAR_COLLAPSED_COOKIE}=${next ? "1" : "0"}; path=/; max-age=${ADMIN_SIDEBAR_COOKIE_MAX_AGE}; samesite=lax`;
  }

  const toggleLabel = collapsed ? t("sidebar.expand") : t("sidebar.collapse");

  return (
    <div className={`admin-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <Link className="admin-sidebar-brand" href={`/${locale}/admin`}>
            <ServiceLogo />
            <span className="admin-sidebar-brand-text">
              <strong>{t("brand")}</strong>
              <small>{t("tagline")}</small>
            </span>
          </Link>
          <button
            aria-expanded={!collapsed}
            aria-label={toggleLabel}
            className="admin-sidebar-toggle"
            onClick={toggleSidebar}
            title={toggleLabel}
            type="button"
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label={t("navLabel")}>
          {navItems
            .filter((item) => role === "ADMIN" || item.href !== "/admin/settings")
            .map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathnameWithoutLocale === item.href
              : pathnameWithoutLocale.startsWith(item.href);
            const label = t(`nav.${item.labelKey}`);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`admin-nav-item ${active ? "active" : ""}`}
                href={`/${locale}${item.href}`}
                key={item.href}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} />
                <span className="admin-nav-label">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div
            className="admin-user-card"
            title={collapsed ? [adminName, adminEmail].filter(Boolean).join(" · ") : undefined}
          >
            <div className="admin-user-avatar">
              {adminName.slice(0, 1).toUpperCase()}
            </div>
            <div className="admin-user-card-info">
              <strong>{adminName}</strong>
              {adminEmail ? <small>{adminEmail}</small> : null}
              <small>{role === "TRACK_MASTER" ? "Track master" : "Admin"}</small>
            </div>
          </div>
          <LanguageSwitcher />
          <ThemeToggle variant={collapsed ? "icon" : "segmented"} />
          <form action={logoutAdminAction}>
            <input name="locale" type="hidden" value={locale} />
            <Button
              className={collapsed ? "w-full justify-center" : "w-full justify-start"}
              variant="ghost"
              type="submit"
              title={collapsed ? t("logout") : undefined}
            >
              <LogOut size={16} />
              <span className="admin-logout-label">{t("logout")}</span>
            </Button>
          </form>
        </div>
      </aside>
      <div className="admin-content" onWheel={handleAdminContentWheel}>
        {children}
      </div>
    </div>
  );
}
