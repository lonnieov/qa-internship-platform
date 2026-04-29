import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Blocks, ShieldCheck, Sparkles } from "lucide-react";
import { ServiceLogo } from "@/components/service-logo";

type NavItem = {
  href: string;
  label: string;
};

export function V2Topbar({
  brandLabel,
  brandHref,
  navItems,
  actions,
}: {
  brandLabel: string;
  brandHref: string;
  navItems: NavItem[];
  actions?: ReactNode;
}) {
  return (
    <header className="v2-topbar">
      <div className="v2-topbar__inner">
        <Link className="v2-brand" href={brandHref}>
          <ServiceLogo />
          <span>{brandLabel}</span>
        </Link>
        <nav className="v2-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link className="v2-nav__link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="v2-topbar__actions">{actions}</div>
      </div>
    </header>
  );
}

export function V2AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="v2-auth">
      <section className="v2-auth__hero">
        <div className="v2-auth__hero-glow v2-auth__hero-glow--lg" />
        <div className="v2-auth__hero-glow v2-auth__hero-glow--sm" />
        <div className="v2-auth__hero-inner">
          <div className="v2-auth__brandline">
            <ServiceLogo />
            <span>QA Internship Validator</span>
          </div>

          <div className="v2-auth__copy">
            <div className="v2-auth__eyebrow">{eyebrow}</div>
            <h1 className="v2-auth__title">{title}</h1>
            <p className="v2-auth__description">{description}</p>
          </div>

          <div className="v2-auth__feature-list">
            <div className="v2-auth__feature">
              <ShieldCheck size={18} />
              <div>
                <strong>Controlled access</strong>
                <span>Token-first intern flow and isolated admin access.</span>
              </div>
            </div>
            <div className="v2-auth__feature">
              <Blocks size={18} />
              <div>
                <strong>Mixed assessment formats</strong>
                <span>Quiz, API sandbox and future manual-review scenarios.</span>
              </div>
            </div>
            <div className="v2-auth__feature">
              <Sparkles size={18} />
              <div>
                <strong>V2 rollout in progress</strong>
                <span>New frontend is landing incrementally on top of the existing core.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-auth__panel">
        <div className="v2-auth__card">
          {children}
          {footer ? <div className="v2-auth__footer">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}

export function V2AuthPanelHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="v2-auth__panel-header">
      <h2 className="v2-auth__panel-title">{title}</h2>
      <p className="v2-auth__panel-description">{description}</p>
    </div>
  );
}

export function V2InlineLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link className="v2-inline-link" href={href}>
      <span>{children}</span>
      <ArrowRight size={16} />
    </Link>
  );
}
