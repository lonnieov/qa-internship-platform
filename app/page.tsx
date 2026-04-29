import Link from "next/link";
import { ArrowRight, ShieldCheck, TimerReset } from "lucide-react";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="page page-narrow stack-lg">
      <section className="stack-lg" style={{ paddingTop: 48 }}>
        <div className="metric">
          <div className="brand">
            <ServiceLogo />
            QA Internship Validator
          </div>
          <ThemeToggle />
        </div>
        <div className="stack">
          <h1 className="head-1">Платформа ассессмента для отбора стажёров</h1>
          <p className="body-1 muted">
            Два независимых входа, контроль вопросов из админки, стопроцентный
            проходной балл, таймер и запись поведения кандидата во время теста.
          </p>
        </div>
        <div className="nav-row">
          <Button asChild>
            <Link href="/sign-in/intern">
              Войти стажёру <ArrowRight size={18} />
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/sign-in/admin">Войти администратору</Link>
          </Button>
        </div>
      </section>

      <section className="grid-2">
        <Card>
          <CardHeader>
            <ShieldCheck color="var(--primary)" />
          <CardTitle>Доступ по токену</CardTitle>
        </CardHeader>
        <CardContent className="muted">
            Админ создаёт кандидата по имени и фамилии, затем выдаёт токен.
            В базе хранится только SHA-256 хэш токена.
        </CardContent>
      </Card>
        <Card>
          <CardHeader>
            <TimerReset color="var(--primary)" />
            <CardTitle>Тайминг и трекинг</CardTitle>
          </CardHeader>
          <CardContent className="muted">
            После старта фиксируются ответы, переходы, клики, движения курсора и
            время на каждый вопрос. При истечении лимита тест закрывается сам.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
