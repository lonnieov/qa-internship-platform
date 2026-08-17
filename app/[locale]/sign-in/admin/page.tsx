import { getTranslations } from "next-intl/server";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AuthRoleTabs } from "@/components/auth-role-tabs";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminSignInPage() {
  const t = await getTranslations("AdminAuth");

  return (
    <main className="auth-shell" data-auth-role="admin">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <ServiceLogo />
          <strong>{t("brand")}</strong>
        </div>
        <div className="auth-brand-body">
          <h2 className="auth-hero-title">{t("heroTitle")}</h2>
          <p className="auth-hero-text">{t("heroDescription")}</p>
          <ul className="auth-feature-list">
            <li>{t("heroStats.questions")}</li>
            <li>{t("heroStats.reports")}</li>
            <li>{t("heroStats.tokens")}</li>
          </ul>
        </div>
        <small className="auth-brand-foot">{t("footer")}</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-topbar">
          <div className="auth-form-controls">
            <LanguageSwitcher />
            <ThemeToggle variant="icon" />
          </div>
        </div>

        <div className="auth-form-card">
          <div className="auth-form-heading">
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
          </div>
          <AuthRoleTabs activeRole="admin" />
          <AdminLoginForm />
        </div>
      </section>
    </main>
  );
}
