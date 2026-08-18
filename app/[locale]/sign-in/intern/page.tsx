import { AuthRoleTabs } from "@/components/auth-role-tabs";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { TokenLoginForm } from "@/components/intern/token-login-form";

export default function InternSignInPage() {
  return (
    <main className="auth-shell" data-auth-role="intern">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <ServiceLogo />
          <strong>QA Internship platform</strong>
        </div>
        <div className="auth-brand-body">
          <h2 className="auth-hero-title">Платформа отбора стажёров</h2>
          <p className="auth-hero-text">
            Технические ассессменты по API, DevTools и базовой QA-теории для
            будущих инженеров команды Click.
          </p>
          <ul className="auth-feature-list">
            <li>Гибкие форматы: от теории до практических кейсов</li>
            <li>Настраиваемое время на тест и отдельные вопросы</li>
            <li>Автоматическая проверка и отчёты по результатам</li>
          </ul>
        </div>
        <small className="auth-brand-foot">
          © 2026 · Внутренняя QA-платформа
        </small>
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
            <h1>Вход в систему</h1>
            <p>Введите токен, который выдал администратор.</p>
          </div>
          <AuthRoleTabs activeRole="intern" />
          <TokenLoginForm />
        </div>
      </section>
    </main>
  );
}
