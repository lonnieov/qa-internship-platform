"use client";

import type { ReactNode, SyntheticEvent } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Clock3, Send } from "lucide-react";
import {
  selectAnswerAction,
  spendQuestionTimeAction,
  submitApiSandboxAction,
  submitAttemptAction,
} from "@/actions/intern";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type Option = {
  id: string;
  label: string;
  text: string;
  order: number;
};

type ResponseSnapshot = {
  status: number;
  headers: Record<string, string>;
  body: JsonValue;
};

type Question = {
  id: string;
  type: "QUIZ" | "API_SANDBOX";
  text: string;
  explanation: string | null;
  options: Option[];
  selectedOptionId: string | null;
  timeSpentMs: number;
  submissionCount: number;
  apiConfig: Record<string, unknown> | null;
  apiRequest: Record<string, unknown> | null;
  apiResponse: Record<string, unknown> | null;
  isCorrect: boolean;
};

type TrackingType =
  | "MOUSE_MOVE"
  | "CLICK"
  | "KEYDOWN"
  | "VISIBILITY_CHANGE"
  | "FOCUS"
  | "BLUR"
  | "NAVIGATION";

type ApiDraft = {
  method: string;
  url: string;
  headersText: string;
  bodyText: string;
  response: ResponseSnapshot | null;
  submissionCount: number;
  isCorrect: boolean;
};

function stringifyJson(value: JsonValue | null | undefined) {
  if (typeof value === "undefined") return "";
  return JSON.stringify(value, null, 2);
}

function headersToText(headers: Record<string, string> | undefined) {
  if (!headers) return "";
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function buildUrl(path: string | undefined, query: Record<string, string> | undefined) {
  const safePath = path || "";
  const search = new URLSearchParams(query ?? {}).toString();
  return search ? `${safePath}?${search}` : safePath;
}

function createInitialApiDraft(question: Question): ApiDraft {
  const request = (question.apiRequest ?? {}) as {
    method?: string;
    path?: string;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    body?: JsonValue | null;
  };

  return {
    method: request.method || "GET",
    url: buildUrl(request.path, request.query) || "",
    headersText: headersToText(request.headers),
    bodyText: stringifyJson(request.body),
    response: (question.apiResponse as ResponseSnapshot | null) ?? null,
    submissionCount: question.submissionCount,
    isCorrect: question.isCorrect,
  };
}

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
        questions
          .filter((question) => question.type === "QUIZ")
          .map((question) => [question.id, question.selectedOptionId]),
      ),
  );
  const [apiDrafts, setApiDrafts] = useState(
    () =>
      new Map(
        questions
          .filter((question) => question.type === "API_SANDBOX")
          .map((question) => [question.id, createInitialApiDraft(question)]),
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
  const answeredCount = questions.filter((question) => {
    if (question.type === "API_SANDBOX") {
      return (apiDrafts.get(question.id)?.submissionCount ?? 0) > 0;
    }

    return Boolean(answers.get(question.id));
  }).length;
  const progress = questions.length === 0 ? 0 : (answeredCount / questions.length) * 100;

  async function postEvent(type: TrackingType, event?: Event | SyntheticEvent) {
    const native = event && "nativeEvent" in event ? event.nativeEvent : event;
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
    if (currentQuestion.type !== "QUIZ") return;

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

  function updateApiDraft(patch: Partial<ApiDraft>) {
    if (currentQuestion.type !== "API_SANDBOX") return;

    setApiDrafts((prev) => {
      const next = new Map(prev);
      const current = next.get(currentQuestion.id) ?? createInitialApiDraft(currentQuestion);
      next.set(currentQuestion.id, { ...current, ...patch });
      return next;
    });
  }

  function sendApiRequest() {
    if (currentQuestion.type !== "API_SANDBOX") return;

    const draft = apiDrafts.get(currentQuestion.id) ?? createInitialApiDraft(currentQuestion);
    const timeSpentMs = Date.now() - enteredAtRef.current;
    enteredAtRef.current = Date.now();

    startTransition(() => {
      void submitApiSandboxAction({
        attemptId,
        questionId: currentQuestion.id,
        method: draft.method,
        url: draft.url,
        headersText: draft.headersText,
        bodyText: draft.bodyText,
        timeSpentMs,
      }).then((result) => {
        if (!result?.ok) return;

        setApiDrafts((prev) => {
          const next = new Map(prev);
          const current = next.get(currentQuestion.id) ?? draft;
          next.set(currentQuestion.id, {
            ...current,
            response: result.response,
            submissionCount: current.submissionCount + 1,
            isCorrect: Boolean(result.correct),
          });
          return next;
        });
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
  const currentApiDraft =
    currentQuestion.type === "API_SANDBOX"
      ? apiDrafts.get(currentQuestion.id) ?? createInitialApiDraft(currentQuestion)
      : null;

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
            <div className="nav-row" style={{ justifyContent: "space-between" }}>
              <CardTitle>
                {currentIndex + 1}. {currentQuestion.text}
              </CardTitle>
              <Badge variant={currentQuestion.type === "API_SANDBOX" ? "warning" : "default"}>
                {currentQuestion.type === "API_SANDBOX" ? "API Sandbox" : "Quiz"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="stack">
            {currentQuestion.explanation ? (
              <p className="body-2 muted m-0">{currentQuestion.explanation}</p>
            ) : null}

            {currentQuestion.type === "QUIZ" ? (
              <>
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
              </>
            ) : currentApiDraft ? (
              <div className="stack">
                <div className="grid-2">
                  <div className="form-grid">
                    <LabelLike>Method</LabelLike>
                    <Select
                      value={currentApiDraft.method}
                      onChange={(event) => updateApiDraft({ method: event.target.value })}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </Select>
                  </div>
                  <div className="form-grid">
                    <LabelLike>Request URL</LabelLike>
                    <Input
                      data-track="api-url"
                      onChange={(event) => updateApiDraft({ url: event.target.value })}
                      placeholder="/users?status=active"
                      value={currentApiDraft.url}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <LabelLike>Headers</LabelLike>
                  <Textarea
                    data-track="api-headers"
                    onChange={(event) => updateApiDraft({ headersText: event.target.value })}
                    placeholder={"Authorization: Bearer test-token\nContent-Type: application/json"}
                    value={currentApiDraft.headersText}
                  />
                </div>

                <div className="form-grid">
                  <LabelLike>JSON Body</LabelLike>
                  <Textarea
                    data-track="api-body"
                    onChange={(event) => updateApiDraft({ bodyText: event.target.value })}
                    placeholder={'{\n  "name": "Ali Valiyev"\n}'}
                    value={currentApiDraft.bodyText}
                  />
                </div>

                <div className="nav-row" style={{ justifyContent: "space-between" }}>
                  <div className="nav-row">
                    <Button type="button" onClick={sendApiRequest} disabled={isPending}>
                      <Send size={18} />
                      Send
                    </Button>
                    <span className="body-2 muted">
                      Отправок: {currentApiDraft.submissionCount}
                    </span>
                  </div>
                  {currentApiDraft.submissionCount > 0 ? (
                    <Badge variant={currentApiDraft.isCorrect ? "success" : "warning"}>
                      {currentApiDraft.isCorrect ? "зачтено" : "нужно исправить"}
                    </Badge>
                  ) : null}
                </div>

                {currentApiDraft.response ? (
                  <div className="soft-panel stack">
                    <div className="nav-row" style={{ justifyContent: "space-between" }}>
                      <strong>Response</strong>
                      <Badge variant={currentApiDraft.response.status < 400 ? "success" : "danger"}>
                        {currentApiDraft.response.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="body-2 muted m-0">Headers</p>
                      <pre className="body-2 m-0 whitespace-pre-wrap">
                        {JSON.stringify(currentApiDraft.response.headers, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="body-2 muted m-0">Body</p>
                      <pre className="body-2 m-0 whitespace-pre-wrap">
                        {JSON.stringify(currentApiDraft.response.body, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

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
                  const done =
                    question.type === "API_SANDBOX"
                      ? (apiDrafts.get(question.id)?.submissionCount ?? 0) > 0
                      : Boolean(answers.get(question.id));
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
                Отмечено {answeredCount} из {questions.length}. Для API sandbox вопроса
                прогресс появляется после первой отправки запроса.
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

function LabelLike({ children }: { children: ReactNode }) {
  return <span className="body-2 muted">{children}</span>;
}
