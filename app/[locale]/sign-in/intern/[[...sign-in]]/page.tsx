import { AuthRoleTabs } from "@/components/auth-role-tabs";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { TokenLoginForm } from "@/components/intern/token-login-form";
import { Badge } from "@/components/ui/badge";

export default function InternSignInPage() {
  return (
    <main className="auth-shell" data-auth-role="intern">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <ServiceLogo />
          <strong>QA Internship platform</strong>
        </div>
        <div>
          <h1>Платформа отбора стажёров</h1>
          <p>
            Технические ассессменты по API, DevTools и базовой QA-теории для
            будущих инженеров команды Click.
          </p>
          <div className="auth-stats">
            <div>
              <strong>3</strong>
              <span>типа вопросов</span>
            </div>
            <div>
              <strong>30 мин</strong>
              <span>лимит по умолчанию</span>
            </div>
          </div>
        </div>
        <small>© 2026 · Внутренняя QA-платформа</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-top">
            <Badge>Стажёр</Badge>
            <ThemeToggle />
          </div>
          <div className="stack">
            <h2 className="head-1">Вход в систему</h2>
            <p className="body-1 muted m-0">
              Введите токен, который выдал администратор.
            </p>
          </div>
          <AuthRoleTabs activeRole="intern" />
          <TokenLoginForm />
        </div>
      </section>
    </main>
  );
}
