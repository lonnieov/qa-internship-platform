import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AuthRoleTabs } from "@/components/auth-role-tabs";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export default function AdminSignInPage() {
  return (
    <main className="auth-shell" data-auth-role="admin">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <ServiceLogo />
          <strong>QA Internship platform</strong>
        </div>
        <div>
          <h1>Админ-панель ассессмента</h1>
          <p>
            Управляйте стажёрами, токенами доступа, банком вопросов и
            результатами прохождения.
          </p>
          <div className="auth-stats">
            <div>
              <strong>CRUD</strong>
              <span>банк вопросов</span>
            </div>
            <div>
              <strong>MD</strong>
              <span>AI-отчёты</span>
            </div>
            <div>
              <strong>Token</strong>
              <span>доступ стажёров</span>
            </div>
          </div>
        </div>
        <small>© 2026 · Внутренняя QA-платформа</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-top">
            <Badge variant="warning">Администратор</Badge>
            <ThemeToggle />
          </div>
          <div className="stack">
            <h2 className="head-1">Вход администратора</h2>
            <p className="body-1 muted m-0">
              Вход администратора хранит пароль и сессию в базе данных и не
              пересекается со входом стажёра по токену.
            </p>
          </div>
          <AuthRoleTabs activeRole="admin" />
          <AdminLoginForm />
        </div>
      </section>
    </main>
  );
}
