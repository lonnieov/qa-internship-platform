import Link from "next/link";
import { AdminRegisterForm } from "@/components/admin/admin-register-form";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { canRegisterAdmin } from "@/lib/admin-auth";

export default async function AdminSignUpPage() {
  const registrationAvailable = await canRegisterAdmin();
  const requireRegistrationCode = Boolean(process.env.ADMIN_REGISTRATION_CODE);

  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <ServiceLogo />
          <strong>Coin</strong>
        </div>
        <div>
          <h1>Регистрация администратора</h1>
          <p>
            Создайте локальный аккаунт администратора для управления
            стажёрами, токенами и вопросами ассессмента.
          </p>
          <div className="auth-stats">
            <div>
              <strong>DB</strong>
              <span>пароль и сессии</span>
            </div>
            <div>
              <strong>Token</strong>
              <span>вход стажёров</span>
            </div>
            <div>
              <strong>Admin</strong>
              <span>роль доступа</span>
            </div>
          </div>
        </div>
        <small>© 2026 Coin · Внутренняя QA-платформа</small>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-top">
            <Badge variant="warning">Администратор</Badge>
            <ThemeToggle />
          </div>
          <div className="stack">
            <h2 className="head-1">Новый аккаунт</h2>
            <p className="body-1 muted m-0">
              Первый администратор регистрируется свободно. Следующие аккаунты
              требуют код, если он задан в окружении.
            </p>
          </div>
          <div className="auth-tabs">
            <Link href="/sign-in/admin">Вход</Link>
            <span className="active">Регистрация</span>
          </div>
          {registrationAvailable ? (
            <AdminRegisterForm
              requireRegistrationCode={requireRegistrationCode}
            />
          ) : (
            <p className="body-1 muted m-0">
              Регистрация закрыта. Войдите под существующим аккаунтом
              администратора.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
