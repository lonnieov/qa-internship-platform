import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut, Search, Settings, Shield, Users, List, BarChart3 } from "lucide-react";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function CoinLogo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="coin-logo">
        <div className="coin-logo__mark">C</div>
        <div className="coin-logo__wordmark">
          <div className="coin-logo__title">Coin</div>
          <div className="coin-logo__subtitle">Assessment</div>
        </div>
      </div>
    );
  }

  return (
    <div className="coin-brand-wordmark">
      <div className="coin-brand-wordmark__mark">C</div>
      <div className="coin-brand-wordmark__text">Coin</div>
    </div>
  );
}

export function CoinAvatar({ name }: { name: string }) {
  const palette = ["#0077FF", "#AA43C4", "#E0A500", "#00CC52", "#FF8800", "#FF4400"];
  const hash = name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <div
      className="coin-avatar"
      style={{ background: palette[hash % palette.length] }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}

type AdminNavItem = {
  id: "dashboard" | "questions" | "settings" | "results";
  label: string;
  href: string;
};

const adminNavItems: AdminNavItem[] = [
  { id: "dashboard", label: "Стажёры", href: "/admin" },
  { id: "questions", label: "Вопросы", href: "/admin/questions" },
  { id: "settings", label: "Настройки теста", href: "/admin/settings" },
  { id: "results", label: "Результаты", href: "/admin" },
];

function navIcon(id: AdminNavItem["id"]) {
  switch (id) {
    case "dashboard":
      return <Users size={18} />;
    case "questions":
      return <List size={18} />;
    case "settings":
      return <Settings size={18} />;
    case "results":
      return <BarChart3 size={18} />;
  }
}

export function CoinAdminSidebar({
  active,
  adminName,
  onLogout,
}: {
  active: AdminNavItem["id"];
  adminName: string;
  onLogout: ReactNode;
}) {
  return (
    <aside className="coin-sidebar">
      <div className="coin-sidebar__logo">
        <CoinLogo compact />
      </div>

      <nav className="coin-sidebar__nav">
        {adminNavItems.map((item) => (
          <Link
            className={`coin-nav-item${active === item.id ? " coin-nav-item--active" : ""}`}
            href={item.href}
            key={item.id}
          >
            {navIcon(item.id)}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="coin-sidebar__footer">
        <div className="coin-admin-card">
          <CoinAvatar name={adminName} />
          <div className="coin-admin-card__meta">
            <div className="coin-admin-card__name">{adminName}</div>
            <div className="coin-admin-card__role">Администратор</div>
          </div>
          <div className="coin-admin-card__logout">{onLogout}</div>
        </div>
      </div>
    </aside>
  );
}

export function CoinSidebarLogoutButton({
  label = "Выйти",
}: {
  label?: string;
}) {
  return (
    <span className="coin-sidebar-logout" title={label}>
      <LogOut size={16} />
    </span>
  );
}

export function CoinTopbar({
  title,
  subtitle,
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="coin-topbar">
      <div>
        <div className="coin-topbar__title">{title}</div>
        {subtitle ? <div className="coin-topbar__subtitle">{subtitle}</div> : null}
      </div>
      <div className="coin-topbar__actions">{right}</div>
    </div>
  );
}

export function CoinRoleTabs({
  active,
  internHref,
  adminHref,
}: {
  active: "intern" | "admin";
  internHref: string;
  adminHref: string;
}) {
  return (
    <div className="coin-role-tabs">
      <Link
        className={`coin-role-tabs__item${active === "intern" ? " is-active" : ""}`}
        href={internHref}
      >
        <Users size={16} />
        Стажёр
      </Link>
      <Link
        className={`coin-role-tabs__item${active === "admin" ? " is-active" : ""}`}
        href={adminHref}
      >
        <Shield size={16} />
        Администратор
      </Link>
    </div>
  );
}

export function CoinSearchButton() {
  return (
    <button className="coin-btn coin-btn--secondary" type="button">
      <Search size={16} />
      Поиск
    </button>
  );
}
