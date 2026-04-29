import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="page v2-page">
      <section className="v2-landing">
        <div className="v2-landing__header">
          <div className="brand">
            <ServiceLogo /> QA Internship Validator
          </div>
          <ThemeToggle />
        </div>

        <div className="v2-landing__hero">
          <div className="v2-landing__copy">
            <Badge>V2 rollout</Badge>
            <h1 className="v2-page__title">Платформа ассессмента для отбора стажёров</h1>
            <p className="v2-page__description">
              Два независимых входа, контроль вопросов из админки, стопроцентный
              проходной балл, таймер и запись поведения кандидата во время теста.
            </p>
            <div className="v2-page__hero-actions">
              <Button asChild>
                <Link href="/sign-in/intern">
                  Войти стажёру <ArrowRight size={18} />
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/sign-in/admin">Войти администратору</Link>
              </Button>
            </div>
          </div>

          <div className="v2-landing__stats">
            <div className="v2-landing__stat">
              <strong>100%</strong>
              <span>проходной балл</span>
            </div>
            <div className="v2-landing__stat">
              <strong>3</strong>
              <span>активных формата вопросов</span>
            </div>
            <div className="v2-landing__stat">
              <strong>Token-only</strong>
              <span>текущий intern access flow</span>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-metric-grid v2-metric-grid--three">
        <article className="v2-metric-card">
          <div className="v2-metric-card__icon">
            <ShieldCheck size={18} />
          </div>
          <div className="v2-metric-card__body">
            <span className="v2-metric-card__label">Доступ</span>
            <strong className="v2-metric-card__value">Secure</strong>
            <span className="v2-metric-card__meta">
              Админ выдаёт токен, а в базе хранится только его hash.
            </span>
          </div>
        </article>
        <article className="v2-metric-card">
          <div className="v2-metric-card__icon">
            <TimerReset size={18} />
          </div>
          <div className="v2-metric-card__body">
            <span className="v2-metric-card__label">Тайминг</span>
            <strong className="v2-metric-card__value">Tracked</strong>
            <span className="v2-metric-card__meta">
              Время, переходы и действия кандидата сохраняются по ходу теста.
            </span>
          </div>
        </article>
        <article className="v2-metric-card">
          <div className="v2-metric-card__icon">
            <Sparkles size={18} />
          </div>
          <div className="v2-metric-card__body">
            <span className="v2-metric-card__label">Новый UI</span>
            <strong className="v2-metric-card__value">V2</strong>
            <span className="v2-metric-card__meta">
              Новый frontend внедряется поверх существующего production backend.
            </span>
          </div>
        </article>
      </section>

      <section className="grid-2">
        <Card className="v2-card">
          <CardHeader className="v2-card__header">
            <div>
              <ShieldCheck color="var(--primary)" />
              <CardTitle>Доступ по токену</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="muted">
            Админ создаёт кандидата по имени и фамилии, затем выдаёт токен.
            В базе хранится только SHA-256 хэш токена.
          </CardContent>
        </Card>
        <Card className="v2-card">
          <CardHeader className="v2-card__header">
            <div>
              <CheckCircle2 color="var(--primary)" />
              <CardTitle>Текущие question types</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="muted">
            Уже поддерживаются `QUIZ`, `API_SANDBOX` и `DEVTOOLS_SANDBOX`. Более
            сложные review-сценарии готовятся в `v2`.
          </CardContent>
        </Card>
        <Card className="v2-card">
          <CardHeader className="v2-card__header">
            <div>
              <TimerReset color="var(--primary)" />
              <CardTitle>Тайминг и трекинг</CardTitle>
            </div>
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
