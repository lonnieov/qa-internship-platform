import Link from "next/link";
import { ArrowRight, ListChecks, ShieldCheck, TimerReset } from "lucide-react";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="page page-narrow stack-lg">
      <section
        className="surface stack-lg"
        style={{ padding: 32, marginTop: 48 }}
      >
        <div className="metric">
          <div className="brand">
            <ServiceLogo />
            <span>
              <strong>Coin</strong> Assessment
            </span>
          </div>
          <ThemeToggle />
        </div>
        <div className="stack">
          <h1 className="head-1">Платформа отбора стажёров</h1>
          <p className="body-1 muted">
            Два независимых входа, токены для стажёров, контроль вопросов из
            админки, стопроцентный проходной балл и таймер на попытку.
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

      <section className="grid-3">
        <Card>
          <CardHeader>
            <ShieldCheck color="var(--primary)" />
            <CardTitle>Доступ по токену</CardTitle>
          </CardHeader>
          <CardContent className="muted">
            Админ создаёт кандидата по имени и фамилии, затем выдаёт токен. В
            базе хранится только SHA-256 хэш токена.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <TimerReset color="var(--primary)" />
            <CardTitle>Одна попытка</CardTitle>
          </CardHeader>
          <CardContent className="muted">
            После старта фиксируется время на каждый вопрос. При истечении
            лимита тест закрывается сам.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <ListChecks color="var(--primary)" />
            <CardTitle>Три типа вопросов</CardTitle>
          </CardHeader>
          <CardContent className="muted">
            Quiz, API Sandbox и DevTools Sandbox управляются из единого банка
            вопросов.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
