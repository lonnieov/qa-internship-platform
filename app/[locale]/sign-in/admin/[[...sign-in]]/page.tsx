import { getTranslations } from "next-intl/server";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AuthRoleTabs } from "@/components/auth-role-tabs";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export default async function AdminSignInPage() {
  const t = await getTranslations("AdminAuth");
  return (
    <main className="auth-shell" data-auth-role="admin">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <ServiceLogo />
          <strong>{t("brand")}</strong>
        </div>
        <div>
          <h1>{t("heroTitle")}</h1>
          <p>
            {t("heroDescription")}
          </p>
          <div className="auth-stats">
            <div>
              <strong>CRUD</strong>
              <span>{t("heroStats.questions")}</span>
            </div>
            <div>
              <strong>MD</strong>
              <span>{t("heroStats.reports")}</span>
            </div>
            <div>
              <strong>Token</strong>
              <span>{t("heroStats.tokens")}</span>
            </div>
          </div>
        </div>
        <small>{t("footer")}</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-top">
            <Badge variant="warning">{t("badge")}</Badge>
            <div className="nav-row">
              <LanguageSwitcher />
              <ThemeToggle variant="icon" />
            </div>
          </div>
          <div className="stack">
            <h2 className="head-1">{t("title")}</h2>
            <p className="body-1 muted m-0">
              {t("description")}
            </p>
          </div>
          <AuthRoleTabs activeRole="admin" />
          <AdminLoginForm />
        </div>
      </section>
    </main>
  );
}
