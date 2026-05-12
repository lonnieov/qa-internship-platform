"use client";

import type { WheelEvent as ReactWheelEvent } from "react";
import Link from "next/link";
import {
  BarChart3,
  Layers3,
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
  role: "ADMIN" | "TRACK_MASTER" | "INTERN";
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

        <nav className="admin-sidebar-nav" aria-label={t("navLabel")}>
          {navItems
            .filter((item) => role === "ADMIN" || item.href !== "/admin/settings")
            .map((item) => {
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
              <small>{role === "TRACK_MASTER" ? "Track master" : "Admin"}</small>
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
      <div className="admin-content" onWheel={handleAdminContentWheel}>
        {children}
      </div>
    </div>
  );
}
