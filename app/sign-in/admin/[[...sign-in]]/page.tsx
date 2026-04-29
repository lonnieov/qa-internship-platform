import Link from "next/link";
import { DemoAdminLoginForm } from "@/components/admin/demo-admin-login-form";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminSignInPage() {
  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <ServiceLogo />
          <strong>Coin</strong>
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
              <strong>PDF</strong>
              <span>отчёты</span>
            </div>
            <div>
              <strong>Token</strong>
              <span>доступ стажёров</span>
            </div>
          </div>
        </div>
        <small>© 2026 Coin · Внутренняя HR-платформа</small>
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
              Локальный вход администратора не зависит от Clerk и не
              пересекается со входом стажёра по токену.
            </p>
          </div>
          <div className="auth-tabs">
            <Link href="/sign-in/intern">Стажёр</Link>
            <span className="active">Администратор</span>
          </div>
          <DemoAdminLoginForm />
          <Button variant="ghost" asChild>
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
