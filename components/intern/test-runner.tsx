"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Clock3, Send } from "lucide-react";
import {
  selectAnswerAction,
  spendQuestionTimeAction,
  submitAttemptAction,
} from "@/actions/intern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Option = {
  id: string;
  label: string;
  text: string;
  order: number;
};

type Question = {
  id: string;
  text: string;
  options: Option[];
  selectedOptionId: string | null;
  timeSpentMs: number;
};

type TrackingType =
  | "MOUSE_MOVE"
  | "CLICK"
  | "KEYDOWN"
  | "VISIBILITY_CHANGE"
  | "FOCUS"
  | "BLUR"
  | "NAVIGATION";

export function TestRunner({
  attemptId,
  startedAt,
  deadlineAt,
  questions,
}: {
  attemptId: string;
  startedAt: string;
  deadlineAt: string;
  questions: Question[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(
    () =>
      new Map(
        questions.map((question) => [question.id, question.selectedOptionId]),
      ),
  );
  const [remainingMs, setRemainingMs] = useState(
    Math.max(0, new Date(deadlineAt).getTime() - Date.now()),
  );
  const [isPending, startTransition] = useTransition();
  const enteredAtRef = useRef(Date.now());
  const submittedRef = useRef(false);
  const lastMoveRef = useRef(0);
  const startedAtMs = useMemo(() => new Date(startedAt).getTime(), [startedAt]);
  const currentQuestion = questions[currentIndex];
  const answeredCount = Array.from(answers.values()).filter(Boolean).length;
  const progress = questions.length === 0 ? 0 : (answeredCount / questions.length) * 100;

  async function postEvent(type: TrackingType, event?: Event | React.SyntheticEvent) {
    const native =
      event && "nativeEvent" in event ? event.nativeEvent : event;
    const pointer =
      native instanceof MouseEvent
        ? { x: Math.round(native.clientX), y: Math.round(native.clientY) }
        : {};
    const rawTarget = event?.target;
    const target =
      rawTarget instanceof HTMLElement
        ? rawTarget.dataset.track || rawTarget.tagName.toLowerCase()
        : undefined;

    await fetch("/api/tracking/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        attemptId,
        questionId: currentQuestion?.id,
        type,
        target,
        elapsedMs: Date.now() - startedAtMs,
        ...pointer,
        metadata:
          type === "VISIBILITY_CHANGE"
            ? { visibilityState: document.visibilityState }
            : undefined,
      }),
    });
  }

  function flushCurrentTime() {
    const questionId = currentQuestion?.id;
    const timeSpentMs = Date.now() - enteredAtRef.current;
    enteredAtRef.current = Date.now();

    if (questionId && timeSpentMs > 150) {
      startTransition(() => {
        void spendQuestionTimeAction({ attemptId, questionId, timeSpentMs });
      });
    }

    return timeSpentMs;
  }

  function goTo(index: number) {
    if (index < 0 || index >= questions.length || index === currentIndex) return;
    flushCurrentTime();
    void postEvent("NAVIGATION");
    setCurrentIndex(index);
  }

  function selectOption(optionId: string) {
    const questionId = currentQuestion.id;
    const timeSpentMs = Date.now() - enteredAtRef.current;
    enteredAtRef.current = Date.now();
    setAnswers((prev) => new Map(prev).set(questionId, optionId));

    startTransition(() => {
      void selectAnswerAction({
        attemptId,
        questionId,
        optionId,
        timeSpentMs,
      });
    });
  }

  function submit(auto = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    flushCurrentTime();
    startTransition(() => {
      void submitAttemptAction({ attemptId, auto });
    });
  }

  useEffect(() => {
    enteredAtRef.current = Date.now();
    if (currentQuestion) {
      startTransition(() => {
        void spendQuestionTimeAction({
          attemptId,
          questionId: currentQuestion.id,
          timeSpentMs: 0,
          countVisit: true,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, currentQuestion?.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const next = Math.max(0, new Date(deadlineAt).getTime() - Date.now());
      setRemainingMs(next);
      if (next === 0) {
        submit(true);
      }
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineAt]);

  useEffect(() => {
    function handleMove(event: MouseEvent) {
      const now = Date.now();
      if (now - lastMoveRef.current < 750) return;
      lastMoveRef.current = now;
      void postEvent("MOUSE_MOVE", event);
    }

    function handleClick(event: MouseEvent) {
      void postEvent("CLICK", event);
    }

    function handleKeydown(event: KeyboardEvent) {
      void postEvent("KEYDOWN", event);
    }

    function handleVisibility() {
      void postEvent("VISIBILITY_CHANGE");
    }

    function handleFocus() {
      void postEvent("FOCUS");
    }

    function handleBlur() {
      void postEvent("BLUR");
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeydown);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      if (!submittedRef.current) {
        flushCurrentTime();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  return (
    <main className="page stack-lg">
      <div className="page-header">
        <div>
          <h1 className="head-1">Тестирование</h1>
          <p className="body-1 muted m-0">
            Можно возвращаться к вопросам до истечения общего времени.
          </p>
        </div>
        <span className="timer-pill">
          <Clock3 size={18} />
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>

      <section className="grid-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {currentIndex + 1}. {currentQuestion.text}
            </CardTitle>
          </CardHeader>
          <CardContent className="stack">
            <div className="stack">
              {currentQuestion.options.map((option) => {
                const selected = answers.get(currentQuestion.id) === option.id;
                return (
                  <button
                    className="soft-panel text-left transition"
                    data-track={`answer-${option.label}`}
                    key={option.id}
                    onClick={() => selectOption(option.id)}
                    style={{
                      border: selected
                        ? "2px solid var(--primary)"
                        : "1px solid var(--surface-border)",
                      background: selected ? "var(--muted)" : "var(--card)",
                    }}
                    type="button"
                  >
                    <strong>{option.label}.</strong> {option.text}
                  </button>
                );
              })}
            </div>
            <div className="nav-row">
              <Button
                variant="secondary"
                type="button"
                onClick={() => goTo(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                <ArrowLeft size={18} />
                Назад
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() => goTo(currentIndex + 1)}
                disabled={currentIndex === questions.length - 1}
              >
                Далее
                <ArrowRight size={18} />
              </Button>
              <Button type="button" onClick={() => submit(false)} disabled={isPending}>
                <Send size={18} />
                Завершить
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="stack">
          <Card>
            <CardHeader>
              <CardTitle>Навигация</CardTitle>
            </CardHeader>
            <CardContent className="stack">
              <Progress value={progress} />
              <div className="question-grid">
                {questions.map((question, index) => {
                  const done = Boolean(answers.get(question.id));
                  const active = index === currentIndex;
                  return (
                    <button
                      className={`question-dot ${done ? "done" : ""} ${
                        active ? "active" : ""
                      }`}
                      key={question.id}
                      onClick={() => goTo(index)}
                      type="button"
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <p className="body-2 muted m-0">
                Отвечено {answeredCount} из {questions.length}. Неотвеченные при
                автозавершении получат 0.
              </p>
            </CardContent>
          </Card>

          {remainingMs < 60_000 ? (
            <div className="soft-panel nav-row" style={{ color: "var(--destructive)" }}>
              <AlertTriangle size={18} />
              <strong>Осталось меньше минуты</strong>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
