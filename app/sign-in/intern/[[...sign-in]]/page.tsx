import Link from "next/link";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { TokenLoginForm } from "@/components/intern/token-login-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function InternSignInPage() {
  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <ServiceLogo />
          <strong>Coin</strong>
        </div>
        <div>
          <h1>Платформа отбора стажёров</h1>
          <p>
            Технические ассессменты по API, DevTools и базовой QA-теории для
            будущих инженеров команды Coin.
          </p>
          <div className="auth-stats">
            <div>
              <strong>%</strong>
              <span>итоговый результат</span>
            </div>
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
        <small>© 2026 Coin · Внутренняя HR-платформа</small>
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
          <div className="auth-tabs">
            <span className="active">Стажёр</span>
            <Link href="/sign-in/admin">Администратор</Link>
          </div>
          <TokenLoginForm />
          <Button variant="ghost" asChild>
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
