"use client";

import type { ClipboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock3,
  Flag,
  Send,
} from "lucide-react";
import {
  selectAnswerAction,
  submitDevtoolsAnswerAction,
  spendQuestionTimeAction,
  submitApiSandboxAction,
  submitAttemptAction,
} from "@/actions/intern";
import { CoinLogo } from "@/components/layout/coin-shell";
import { InProgressOverlay } from "@/components/ui/in-progress-overlay";

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
  type: "QUIZ" | "API_SANDBOX" | "DEVTOOLS_SANDBOX";
  text: string;
  explanation: string | null;
  options: Option[];
  selectedOptionId: string | null;
  timeSpentMs: number;
  submissionCount: number;
  apiConfig: unknown;
  apiRequest: unknown;
  apiResponse: unknown;
  isCorrect: boolean;
};

type ApiDraft = {
  method: string;
  url: string;
  headersText: string;
  bodyText: string;
  response: ResponseSnapshot | null;
  devtoolsAnswer: string;
  requestSent: boolean;
  submissionCount: number;
  isCorrect: boolean;
};

type DevtoolsConfig = {
  mode?: string;
  method?: string;
  path?: string;
  query?: Record<string, string>;
  body?: JsonValue;
  buttonLabel?: string;
  answerLabel?: string;
  answerPath?: string;
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
  const config = getDevtoolsConfig(question);
  const request = (question.apiRequest ?? {}) as {
    method?: string;
    path?: string;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    body?: JsonValue | null;
    answerText?: string;
  };

  return {
    method: request.method || config?.method || "GET",
    url: buildUrl(request.path, request.query) || buildUrl(config?.path, config?.query) || "",
    headersText: headersToText(request.headers),
    bodyText: stringifyJson(request.body ?? config?.body),
    response: (question.apiResponse as ResponseSnapshot | null) ?? null,
    devtoolsAnswer: request.answerText || "",
    requestSent: Boolean(question.apiResponse),
    submissionCount: question.submissionCount,
    isCorrect: question.isCorrect,
  };
}

function getDevtoolsConfig(question: Question) {
  const config =
    question.apiConfig && typeof question.apiConfig === "object" && !Array.isArray(question.apiConfig)
      ? (question.apiConfig as DevtoolsConfig)
      : null;

  return config?.mode === "DEVTOOLS_RESPONSE" ? config : null;
}

function questionMeta(question: Question) {
  if (question.type === "API_SANDBOX") {
    return { label: "API Testing", chipClass: "chip chip-blue" };
  }

  if (question.type === "DEVTOOLS_SANDBOX") {
    return { label: "Documentation Review", chipClass: "chip chip-orange" };
  }

  return { label: "General", chipClass: "chip chip-grey" };
}

function buildDevtoolsEndpoint(attemptId: string, question: Question, config: DevtoolsConfig) {
  const path = (config.path || "/devtools_task").replace(/^\/+/, "");
  const search = new URLSearchParams({ attempt: attemptId });

  for (const [key, value] of Object.entries(config.query ?? {})) {
    search.set(key, value);
  }

  return `/api/devtools-sandbox/${question.id}/${path}?${search.toString()}`;
}

export function TestRunner({
  attemptId,
  deadlineAt,
  questions,
}: {
  attemptId: string;
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
          .filter(
            (question) =>
              question.type === "API_SANDBOX" ||
              question.type === "DEVTOOLS_SANDBOX",
          )
          .map((question) => [question.id, createInitialApiDraft(question)]),
      ),
  );
  const [remainingMs, setRemainingMs] = useState(
    Math.max(0, new Date(deadlineAt).getTime() - Date.now()),
  );
  const [isPending, startTransition] = useTransition();
  const enteredAtRef = useRef(Date.now());
  const submittedRef = useRef(false);
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((question) => {
    if (question.type === "API_SANDBOX" || question.type === "DEVTOOLS_SANDBOX") {
      return (apiDrafts.get(question.id)?.submissionCount ?? 0) > 0;
    }

    return Boolean(answers.get(question.id));
  }).length;
  const progress = questions.length === 0 ? 0 : (answeredCount / questions.length) * 100;

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
    if (
      currentQuestion.type !== "API_SANDBOX" &&
      currentQuestion.type !== "DEVTOOLS_SANDBOX"
    ) {
      return;
    }

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
            response: result.response ?? null,
            submissionCount: current.submissionCount + 1,
            isCorrect: Boolean(result.correct),
          });
          return next;
        });
      });
    });
  }

  function sendDevtoolsRequest() {
    if (currentQuestion.type !== "DEVTOOLS_SANDBOX") return;

    const config = getDevtoolsConfig(currentQuestion);
    if (!config) return;

    const endpoint = buildDevtoolsEndpoint(attemptId, currentQuestion, config);
    const method = (config.method || "GET").toUpperCase();

    startTransition(() => {
      void fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method === "GET" || method === "HEAD"
          ? {}
          : { body: JSON.stringify(config.body ?? { action: "submit" }) }),
      }).then(async (response) => {
        await response.text();
        setApiDrafts((prev) => {
          const next = new Map(prev);
          const current =
            next.get(currentQuestion.id) ?? createInitialApiDraft(currentQuestion);
          next.set(currentQuestion.id, {
            ...current,
            requestSent: true,
          });
          return next;
        });
      });
    });
  }

  function submitDevtoolsAnswer() {
    if (currentQuestion.type !== "DEVTOOLS_SANDBOX") return;

    const draft = apiDrafts.get(currentQuestion.id) ?? createInitialApiDraft(currentQuestion);
    const timeSpentMs = Date.now() - enteredAtRef.current;
    enteredAtRef.current = Date.now();

    startTransition(() => {
      void submitDevtoolsAnswerAction({
        attemptId,
        questionId: currentQuestion.id,
        answerText: draft.devtoolsAnswer,
        timeSpentMs,
      }).then((result) => {
        if (!result?.ok) return;

        setApiDrafts((prev) => {
          const next = new Map(prev);
          const current = next.get(currentQuestion.id) ?? draft;
          next.set(currentQuestion.id, {
            ...current,
            submissionCount: current.submissionCount + 1,
            isCorrect: Boolean(result.correct),
          });
          return next;
        });
      });
    });
  }

  function pasteDevtoolsAnswer(event: ClipboardEvent<HTMLInputElement>) {
    if (currentQuestion.type !== "DEVTOOLS_SANDBOX") return;

    const pastedText = event.clipboardData.getData("text");
    if (!pastedText) return;

    event.preventDefault();

    const input = event.currentTarget;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const nextValue =
      input.value.slice(0, start) + pastedText + input.value.slice(end);

    updateApiDraft({ devtoolsAnswer: nextValue });

    window.setTimeout(() => {
      const cursor = start + pastedText.length;
      input.setSelectionRange(cursor, cursor);
    }, 0);
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
    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        submit(true);
      }
    }

    function handlePageHide() {
      submit(true);
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      if (!submittedRef.current) {
        flushCurrentTime();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const currentApiDraft =
    currentQuestion.type === "API_SANDBOX" ||
    currentQuestion.type === "DEVTOOLS_SANDBOX"
      ? apiDrafts.get(currentQuestion.id) ?? createInitialApiDraft(currentQuestion)
      : null;
  const currentDevtoolsConfig =
    currentQuestion.type === "DEVTOOLS_SANDBOX" ? getDevtoolsConfig(currentQuestion) : null;
  const currentMeta = questionMeta(currentQuestion);

  return (
    <main className="coin-test-page">
      <header className="coin-test-topbar">
        <CoinLogo compact />
        <div className="coin-test-topbar__progress">
          <div className="muted">
            Вопрос <strong>{currentIndex + 1}</strong> / {questions.length}
          </div>
          <div className="coin-progress-bar">
            <div className="coin-progress-bar__fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="coin-test-topbar__timer">
          <Clock3 size={18} />
          <span>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
      </header>

      {currentQuestion.type === "API_SANDBOX" && currentApiDraft ? (
        <section className="coin-api-layout">
          <aside className="coin-api-brief">
            <span className={currentMeta.chipClass}>{currentMeta.label}</span>
            <h2>API задание</h2>
            <p>{currentQuestion.text}</p>

            <div className="coin-rail-section-title">Условия задачи</div>
            <div className="coin-check-list">
              {(currentQuestion.explanation
                ? currentQuestion.explanation.split(". ").filter(Boolean)
                : [
                    "Соберите корректный HTTP-запрос.",
                    "Проверьте, что ответ совпадает с ожидаемым.",
                    "Используйте нужный метод и JSON body.",
                  ]
              ).map((item) => (
                <div className="coin-check-list__item" key={item}>
                  <span>✓</span>
                  <span>{item.replace(/\.$/, "")}</span>
                </div>
              ))}
            </div>

            <div className="coin-rail-section-title">Авторизация</div>
            <div className="coin-code-inline">{currentApiDraft.headersText || "TODO · auth header"}</div>

            <div className="coin-api-hint">
              <strong>Подсказка.</strong> Для создания нового ресурса обычно нужен `POST`.
            </div>
          </aside>

          <section className="coin-api-builder">
            <div className="coin-api-builder__requestbar">
              <select
                className="coin-method-select"
                onChange={(event) => updateApiDraft({ method: event.target.value })}
                value={currentApiDraft.method}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                className="coin-url-input"
                data-track="api-url"
                onChange={(event) => updateApiDraft({ url: event.target.value })}
                value={currentApiDraft.url}
              />

              <button
                className="coin-btn coin-btn--primary coin-btn--lg"
                data-track="api-send"
                disabled={isPending}
                onClick={sendApiRequest}
                type="button"
              >
                <Send size={16} />
                Send
              </button>
            </div>

            <div className="coin-api-tabs">
              <div className="coin-api-tabs__item">Headers</div>
              <div className="coin-api-tabs__item coin-api-tabs__item--active">Body</div>
              <div className="coin-api-tabs__item">Params</div>
              <div className="coin-api-tabs__item">Auth</div>
            </div>

            <div className="coin-api-builder__editor">
              <div className="coin-api-builder__modes">
                <span className="chip chip-blue">raw</span>
                <span className="chip chip-grey">form-data</span>
                <span className="chip chip-grey">x-www-form-urlencoded</span>
                <span className="chip chip-grey">binary</span>
                <span className="chip chip-grey">JSON</span>
              </div>

              <textarea
                className="coin-code-editor"
                data-track="api-body"
                onChange={(event) => updateApiDraft({ bodyText: event.target.value })}
                value={currentApiDraft.bodyText}
              />

              <div className="coin-api-response">
                <div className="coin-api-response__head">
                  <strong>Response</strong>
                  {currentApiDraft.response ? (
                    <span className={`chip ${currentApiDraft.response.status < 400 ? "chip-green" : "chip-red"}`}>
                      {currentApiDraft.response.status}
                    </span>
                  ) : (
                    <span className="chip chip-grey">ожидается</span>
                  )}
                  <span className="muted">отправок: {currentApiDraft.submissionCount}</span>
                  {currentApiDraft.submissionCount > 0 ? (
                    <span className={`chip ${currentApiDraft.isCorrect ? "chip-green" : "chip-red"}`}>
                      {currentApiDraft.isCorrect ? "Совпадает с ожидаемым" : "Нужно исправить"}
                    </span>
                  ) : null}
                </div>
                <pre className="coin-code-response">
                  {currentApiDraft.response
                    ? JSON.stringify(currentApiDraft.response.body, null, 2)
                    : "Ответ появится после отправки запроса."}
                </pre>
              </div>
            </div>

            <div className="coin-test-footer">
              <div className="coin-test-footer__nav">
                <button
                  className="coin-btn coin-btn--secondary"
                  disabled={currentIndex === 0}
                  onClick={() => goTo(currentIndex - 1)}
                  type="button"
                >
                  <ArrowLeft size={16} />
                  Назад
                </button>
                <button
                  className="coin-btn coin-btn--ghost"
                  onClick={() => goTo(currentIndex + 1)}
                  type="button"
                >
                  Пропустить
                </button>
                <button
                  className="coin-btn coin-btn--primary"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => goTo(currentIndex + 1)}
                  type="button"
                >
                  Дальше
                  <ArrowRight size={16} />
                </button>
              </div>
              <button
                className="coin-btn coin-btn--secondary coin-btn--danger"
                disabled={isPending}
                onClick={() => submit(false)}
                type="button"
              >
                Завершить
              </button>
            </div>
          </section>
        </section>
      ) : (
        <section className="coin-test-layout">
          <div className="coin-test-main">
            <div className="coin-test-main__content">
              <div className="coin-test-main__meta">
                <span className={currentMeta.chipClass}>{currentMeta.label}</span>
                <span className="chip chip-grey">
                  Вопрос {currentIndex + 1} из {questions.length}
                </span>
                <div className="coin-test-main__meta-spacer" />
                <button className="coin-btn coin-btn--ghost coin-btn--sm" type="button">
                  <Flag size={16} />
                  Отметить
                </button>
              </div>

              <h1 className="coin-test-main__title">{currentQuestion.text}</h1>
              <p className="coin-test-main__subtitle">
                {currentQuestion.explanation || "Выберите один правильный вариант ответа."}
              </p>

              {currentQuestion.type === "QUIZ" ? (
                <div className="coin-test-options">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const selected = answers.get(currentQuestion.id) === option.id;
                    return (
                      <button
                        className={`coin-test-option${selected ? " coin-test-option--selected" : ""}`}
                        data-track={`answer-${option.label}`}
                        key={option.id}
                        onClick={() => selectOption(option.id)}
                        type="button"
                      >
                        <span className="coin-test-option__radio">
                          {selected ? <span /> : null}
                        </span>
                        <span className="coin-test-option__copy">
                          <strong>{option.text}</strong>
                        </span>
                        <span className="coin-test-option__letter">
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : currentApiDraft && currentDevtoolsConfig ? (
                <div className="coin-devtools-panel coin-panel coin-panel--relative">
                  <div className="coin-devtools-panel__head">
                    <strong>
                      {(currentDevtoolsConfig.method || "GET").toUpperCase()}{" "}
                      {buildDevtoolsEndpoint(attemptId, currentQuestion, currentDevtoolsConfig)}
                    </strong>
                  </div>
                  <div className="coin-devtools-panel__actions">
                    <button
                      className="coin-btn coin-btn--primary"
                      disabled={isPending}
                      onClick={sendDevtoolsRequest}
                      type="button"
                    >
                      <Send size={16} />
                      {currentDevtoolsConfig.buttonLabel || "Отправить запрос"}
                    </button>
                    <input
                      className="coin-input coin-input--plain"
                      onChange={(event) => updateApiDraft({ devtoolsAnswer: event.target.value })}
                      onPaste={pasteDevtoolsAnswer}
                      placeholder={currentDevtoolsConfig.answerPath || "message"}
                      value={currentApiDraft.devtoolsAnswer}
                    />
                    <button
                      className="coin-btn coin-btn--secondary"
                      disabled={isPending || !currentApiDraft.devtoolsAnswer.trim()}
                      onClick={submitDevtoolsAnswer}
                      type="button"
                    >
                      Проверить
                    </button>
                  </div>
                  <InProgressOverlay
                    badgeLabel="TODO"
                    title="Сценарий из макетов ещё не совпадает с текущим backend"
                    description="Для bug detection и document review нужен отдельный UI и новые типы заданий."
                  />
                </div>
              ) : null}

              <div className="coin-test-footer">
                <div className="coin-test-footer__nav">
                  <button
                    className="coin-btn coin-btn--secondary"
                    disabled={currentIndex === 0}
                    onClick={() => goTo(currentIndex - 1)}
                    type="button"
                  >
                    <ArrowLeft size={16} />
                    Назад
                  </button>
                  <button
                    className="coin-btn coin-btn--ghost"
                    onClick={() => goTo(currentIndex + 1)}
                    type="button"
                  >
                    Пропустить
                  </button>
                  <button
                    className="coin-btn coin-btn--primary"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => goTo(currentIndex + 1)}
                    type="button"
                  >
                    Дальше
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="coin-test-sidebar">
            <div className="coin-rail-section-title">Навигация</div>
            <div className="coin-nav-grid">
              {questions.map((question, index) => {
                const done =
                  question.type === "API_SANDBOX" || question.type === "DEVTOOLS_SANDBOX"
                    ? (apiDrafts.get(question.id)?.submissionCount ?? 0) > 0
                    : Boolean(answers.get(question.id));
                const active = index === currentIndex;

                return (
                  <button
                    className={`coin-nav-grid__item${done ? " is-done" : ""}${active ? " is-active" : ""}`}
                    key={question.id}
                    onClick={() => goTo(index)}
                    type="button"
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="coin-divider" />

            <div className="coin-legend-list">
              <div className="coin-legend-item">
                <span className="coin-legend-item__swatch coin-legend-item__swatch--done" />
                Отвечено · {answeredCount}
              </div>
              <div className="coin-legend-item">
                <span className="coin-legend-item__swatch coin-legend-item__swatch--active" />
                Текущий · 1
              </div>
              <div className="coin-legend-item">
                <span className="coin-legend-item__swatch coin-legend-item__swatch--idle" />
                Не открыто · {Math.max(0, questions.length - answeredCount - 1)}
              </div>
            </div>

            <div className="coin-danger-card">
              <div className="coin-danger-card__title">Завершить досрочно</div>
              <div className="coin-danger-card__subtitle">
                После завершения вернуться к ассессменту нельзя.
              </div>
              <button
                className="coin-btn coin-btn--secondary coin-btn--danger coin-btn--full"
                disabled={isPending}
                onClick={() => submit(false)}
                type="button"
              >
                Завершить
              </button>
            </div>

            {remainingMs < 60_000 ? (
              <div className="coin-inline-alert">
                <AlertTriangle size={18} />
                <strong>Осталось меньше минуты</strong>
              </div>
            ) : null}
          </aside>
        </section>
      )}
    </main>
  );
}

function LabelLike({ children }: { children: ReactNode }) {
  return <span className="body-2 muted">{children}</span>;
}
