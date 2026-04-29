import Link from "next/link";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { TokenLoginForm } from "@/components/intern/token-login-form";

export default function InternSignInPage() {
  return (
    <main className="page page-narrow stack-lg">
      <div className="metric">
        <div className="brand">
          <ServiceLogo />
          QA Internship Validator
        </div>
        <ThemeToggle />
      </div>
      <div className="stack">
        <h1 className="head-1">Вход стажёра</h1>
        <p className="body-1 muted">
          Введите токен, который выдал администратор. Почта и регистрация для
          стажёров больше не нужны.
        </p>
      </div>
      <TokenLoginForm />
      <Link className="body-2 muted" href="/sign-in/admin">
        Перейти ко входу администратора
      </Link>
    </main>
  );
}
