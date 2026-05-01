"use client";

import type { ClipboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock3,
  Info,
  MessageSquare,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import {
  saveQuestionCommentAction,
  selectAnswerAction,
  submitManualQaAnswerAction,
  submitOpenQuizAnswerAction,
  submitSqlSandboxAction,
  submitDevtoolsAnswerAction,
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
import { getOpenQuizConfig } from "@/lib/open-quiz";
import { getQuestionTrackMeta } from "@/lib/question-classification";
import { ClickSuperAppClickAvtoPreset } from "@/components/intern/manual-qa-presets/click-super-app-click-avto";
import { ClickSuperAppInstallmentWidgetPreset } from "@/components/intern/manual-qa-presets/click-super-app-installment-widget";
import {
  getManualQaAnswerPayload,
  getManualQaSandboxConfig,
  type ManualQaBugReport,
} from "@/lib/manual-qa-sandbox";
import {
  getSqlSandboxConfig,
  type SqlSandboxExecutionResult,
} from "@/lib/sql-sandbox";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

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
  type:
    | "QUIZ"
    | "API_SANDBOX"
    | "SQL_SANDBOX"
    | "DEVTOOLS_SANDBOX"
    | "MANUAL_QA_SANDBOX";
  track: string;
  text: string;
  explanation: string | null;
  options: Option[];
  selectedOptionId: string | null;
  textAnswer: string;
  timeSpentMs: number;
  submissionCount: number;
  apiConfig: unknown;
  apiRequest: unknown;
  apiResponse: unknown;
  isCorrect: boolean;
  internComment: string;
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
  answerSaveStatus: "idle" | "saving" | "saved";
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

type ManualQaDraft = {
  reports: ManualQaBugReport[];
  noBugsFound: boolean;
  submissionCount: number;
  answerSaveStatus: "idle" | "saving" | "saved";
};

type SqlDraft = {
  query: string;
  response: SqlSandboxExecutionResult | null;
  submissionCount: number;
  isCorrect: boolean;
};

type CommentSaveStatus = "idle" | "saving" | "saved";

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

function buildUrl(
  path: string | undefined,
  query: Record<string, string> | undefined,
) {
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
    url:
      buildUrl(request.path, request.query) ||
      buildUrl(config?.path, config?.query) ||
      "",
    headersText: headersToText(request.headers),
    bodyText: stringifyJson(request.body ?? config?.body),
    response: (question.apiResponse as ResponseSnapshot | null) ?? null,
    devtoolsAnswer: request.answerText || "",
    requestSent: Boolean(question.apiResponse),
    submissionCount: question.submissionCount,
    isCorrect: question.isCorrect,
    answerSaveStatus: question.submissionCount > 0 ? "saved" : "idle",
  };
}

function getDevtoolsConfig(question: Question) {
  const config =
    question.apiConfig &&
    typeof question.apiConfig === "object" &&
    !Array.isArray(question.apiConfig)
      ? (question.apiConfig as DevtoolsConfig)
      : null;

  return config?.mode === "DEVTOOLS_RESPONSE" ? config : null;
}

function createEmptyManualQaReport(index: number): ManualQaBugReport {
  return {
    id: `report-${Date.now()}-${index}`,
    title: "",
    severity: "major",
    category: "functional",
    steps: "",
    actual: "",
    expected: "",
    note: "",
  };
}

function createInitialManualQaDraft(question: Question): ManualQaDraft {
  const payload = getManualQaAnswerPayload(question.apiRequest);

  return {
    reports: payload?.reports ?? [],
    noBugsFound: payload?.noBugsFound ?? false,
    submissionCount: question.submissionCount,
    answerSaveStatus: question.submissionCount > 0 ? "saved" : "idle",
  };
}

function createInitialSqlDraft(question: Question): SqlDraft {
  const request =
    question.apiRequest &&
    typeof question.apiRequest === "object" &&
    !Array.isArray(question.apiRequest)
      ? (question.apiRequest as { query?: unknown })
      : null;

  const response =
    question.apiResponse &&
    typeof question.apiResponse === "object" &&
    !Array.isArray(question.apiResponse)
      ? (question.apiResponse as SqlSandboxExecutionResult)
      : null;

  return {
    query: typeof request?.query === "string" ? request.query : "",
    response,
    submissionCount: question.submissionCount,
    isCorrect: question.isCorrect,
  };
}

function hasCompleteManualQaAnswer(draft: ManualQaDraft | undefined) {
  if (!draft) return false;
  if (draft.noBugsFound) return true;

  return draft.reports.some(
    (report) =>
      report.title.trim() &&
      report.steps.trim() &&
      report.actual.trim() &&
      report.expected.trim(),
  );
}

function buildDevtoolsEndpoint(
  attemptId: string,
  question: Question,
  config: DevtoolsConfig,
) {
  const path = (config.path || "/devtools_task").replace(/^\/+/, "");
  const search = new URLSearchParams({ attempt: attemptId });

  for (const [key, value] of Object.entries(config.query ?? {})) {
    search.set(key, value);
  }

  return `/api/devtools-sandbox/${question.id}/${path}?${search.toString()}`;
}

function getSqlConfig(question: Question) {
  return question.type === "SQL_SANDBOX"
    ? getSqlSandboxConfig(question.apiConfig)
    : null;
}

function ManualQaPresetRenderer({ appPreset }: { appPreset: string }) {
  if (appPreset === "click-super-app-installment-widget-v1") {
    return <ClickSuperAppInstallmentWidgetPreset />;
  }

  return <ClickSuperAppClickAvtoPreset />;
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
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState(
    () =>
      new Map(
        questions.map((question) => [question.id, question.internComment]),
      ),
  );
  const [commentSaveStatuses, setCommentSaveStatuses] = useState(
    () =>
      new Map<string, CommentSaveStatus>(
        questions.map((question) => [
          question.id,
          question.internComment ? "saved" : "idle",
        ]),
      ),
  );
  const [answers, setAnswers] = useState(
    () =>
      new Map(
        questions
          .filter((question) => question.type === "QUIZ")
          .map((question) => [question.id, question.selectedOptionId]),
      ),
  );
  const [textAnswers, setTextAnswers] = useState(
    () =>
      new Map(
        questions
          .filter((question) => question.type === "QUIZ")
          .map((question) => [question.id, question.textAnswer]),
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
  const [manualQaDrafts, setManualQaDrafts] = useState(
    () =>
      new Map(
        questions
          .filter((question) => question.type === "MANUAL_QA_SANDBOX")
          .map((question) => [
            question.id,
            createInitialManualQaDraft(question),
          ]),
      ),
  );
  const [sqlDrafts, setSqlDrafts] = useState(
    () =>
      new Map(
        questions
          .filter((question) => question.type === "SQL_SANDBOX")
          .map((question) => [question.id, createInitialSqlDraft(question)]),
      ),
  );
  const [selectedSqlTables, setSelectedSqlTables] = useState(
    () =>
      new Map(
        questions
          .filter((question) => question.type === "SQL_SANDBOX")
          .map((question) => {
            const config = getSqlConfig(question);
            return [question.id, config?.tables[0]?.name ?? ""];
          }),
      ),
  );
  const [remainingMs, setRemainingMs] = useState(
    Math.max(0, new Date(deadlineAt).getTime() - Date.now()),
  );
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const enteredAtRef = useRef(Date.now());
  const submittedRef = useRef(false);
  const devtoolsAutosaveRef = useRef<number | null>(null);
  const currentQuestion = questions[currentIndex];
  const currentTrack = getQuestionTrackMeta(currentQuestion?.track);
  const answeredCount = questions.filter((question) => {
    if (
      question.type === "API_SANDBOX" ||
      question.type === "DEVTOOLS_SANDBOX" ||
      question.type === "SQL_SANDBOX"
    ) {
      return question.type === "SQL_SANDBOX"
        ? (sqlDrafts.get(question.id)?.submissionCount ?? 0) > 0
        : (apiDrafts.get(question.id)?.submissionCount ?? 0) > 0;
    }

    if (question.type === "MANUAL_QA_SANDBOX") {
      return hasCompleteManualQaAnswer(manualQaDrafts.get(question.id));
    }

    if (getOpenQuizConfig(question.apiConfig)) {
      return Boolean(textAnswers.get(question.id)?.trim());
    }

    return Boolean(answers.get(question.id));
  }).length;
  const progress =
    questions.length === 0 ? 0 : (answeredCount / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const commentedCount = questions.filter((question) =>
    Boolean(commentDrafts.get(question.id)?.trim()),
  ).length;
  const currentQuestionComment = commentDrafts.get(currentQuestion.id) ?? "";
  const currentCommentSaveStatus =
    commentSaveStatuses.get(currentQuestion.id) ?? "idle";

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
    if (index < 0 || index >= questions.length || index === currentIndex)
      return;
    if (currentQuestion && getOpenQuizConfig(currentQuestion.apiConfig)) {
      saveOpenAnswer(currentQuestion);
    }
    if (currentQuestion?.type === "DEVTOOLS_SANDBOX") {
      saveDevtoolsAnswer(currentQuestion, { timeSpentMs: 0 });
    }
    if (currentQuestion?.type === "MANUAL_QA_SANDBOX") {
      saveManualQaAnswer(currentQuestion, { timeSpentMs: 0 });
    }
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

  function updateOpenAnswer(value: string) {
    if (currentQuestion.type !== "QUIZ") return;
    setTextAnswers((prev) => new Map(prev).set(currentQuestion.id, value));
  }

  function saveOpenAnswer(question = currentQuestion) {
    if (question.type !== "QUIZ") return;

    const config = getOpenQuizConfig(question.apiConfig);
    if (!config) return;

    const answerText = textAnswers.get(question.id) ?? "";
    const timeSpentMs = Date.now() - enteredAtRef.current;
    enteredAtRef.current = Date.now();

    startTransition(() => {
      void submitOpenQuizAnswerAction({
        attemptId,
        questionId: question.id,
        answerText,
        timeSpentMs,
      });
    });
  }

  function updateQuestionComment(value: string) {
    if (!currentQuestion) return;
    setCommentDrafts((prev) => {
      const next = new Map(prev);
      next.set(currentQuestion.id, value);
      return next;
    });
    setCommentSaveStatuses((prev) => {
      const next = new Map(prev);
      next.set(currentQuestion.id, "idle");
      return next;
    });
  }

  function saveQuestionComment() {
    if (!currentQuestion) return;

    const questionId = currentQuestion.id;
    const internComment = commentDrafts.get(questionId) ?? "";

    setCommentSaveStatuses((prev) => {
      const next = new Map(prev);
      next.set(questionId, "saving");
      return next;
    });

    startTransition(() => {
      void saveQuestionCommentAction({
        attemptId,
        questionId,
        internComment,
      }).then((result) => {
        if (!result?.ok) return;

        setCommentSaveStatuses((prev) => {
          const next = new Map(prev);
          next.set(questionId, "saved");
          return next;
        });
        setIsCommentDialogOpen(false);
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
      const current =
        next.get(currentQuestion.id) ?? createInitialApiDraft(currentQuestion);
      next.set(currentQuestion.id, { ...current, ...patch });
      return next;
    });
  }

  function updateSqlDraft(questionId: string, patch: Partial<SqlDraft>) {
    setSqlDrafts((prev) => {
      const next = new Map(prev);
      const question = questions.find((item) => item.id === questionId);
      const current =
        next.get(questionId) ?? (question ? createInitialSqlDraft(question) : null);
      if (!current) return prev;
      next.set(questionId, { ...current, ...patch });
      return next;
    });
  }

  function runSqlQuery() {
    if (currentQuestion.type !== "SQL_SANDBOX") return;

    const draft = sqlDrafts.get(currentQuestion.id) ?? createInitialSqlDraft(currentQuestion);
    const timeSpentMs = Date.now() - enteredAtRef.current;
    enteredAtRef.current = Date.now();

    startTransition(() => {
      void submitSqlSandboxAction({
        attemptId,
        questionId: currentQuestion.id,
        query: draft.query,
        timeSpentMs,
      }).then((result) => {
        if (!result?.ok) return;

        setSqlDrafts((prev) => {
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

  function sendApiRequest() {
    if (currentQuestion.type !== "API_SANDBOX") return;

    const draft =
      apiDrafts.get(currentQuestion.id) ??
      createInitialApiDraft(currentQuestion);
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
            next.get(currentQuestion.id) ??
            createInitialApiDraft(currentQuestion);
          next.set(currentQuestion.id, {
            ...current,
            requestSent: true,
          });
          return next;
        });
      });
    });
  }

  function updateDevtoolsAnswer(value: string) {
    if (currentQuestion.type !== "DEVTOOLS_SANDBOX") return;

    updateApiDraft({
      devtoolsAnswer: value,
      answerSaveStatus: value.trim() ? "saving" : "idle",
    });

    if (devtoolsAutosaveRef.current) {
      window.clearTimeout(devtoolsAutosaveRef.current);
    }

    if (!value.trim()) return;

    const question = currentQuestion;
    devtoolsAutosaveRef.current = window.setTimeout(() => {
      saveDevtoolsAnswer(question, { answerText: value, timeSpentMs: 0 });
    }, 650);
  }

  function saveDevtoolsAnswer(
    question = currentQuestion,
    options: { answerText?: string; timeSpentMs?: number } = {},
  ) {
    if (question.type !== "DEVTOOLS_SANDBOX") return;

    const draft = apiDrafts.get(question.id) ?? createInitialApiDraft(question);
    const answerText = options.answerText ?? draft.devtoolsAnswer;
    if (!answerText.trim()) return;

    const timeSpentMs =
      typeof options.timeSpentMs === "number"
        ? options.timeSpentMs
        : Date.now() - enteredAtRef.current;

    if (typeof options.timeSpentMs !== "number") {
      enteredAtRef.current = Date.now();
    }

    setApiDrafts((prev) => {
      const next = new Map(prev);
      const current = next.get(question.id) ?? draft;
      next.set(question.id, { ...current, answerSaveStatus: "saving" });
      return next;
    });

    startTransition(() => {
      void submitDevtoolsAnswerAction({
        attemptId,
        questionId: question.id,
        answerText,
        timeSpentMs,
      }).then((result) => {
        if (!result?.ok) return;

        setApiDrafts((prev) => {
          const next = new Map(prev);
          const current = next.get(question.id) ?? draft;
          next.set(question.id, {
            ...current,
            devtoolsAnswer: answerText,
            submissionCount: Math.max(1, current.submissionCount),
            answerSaveStatus: "saved",
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

    updateDevtoolsAnswer(nextValue);

    window.setTimeout(() => {
      const cursor = start + pastedText.length;
      input.setSelectionRange(cursor, cursor);
    }, 0);
  }

  function updateManualQaDraft(
    questionId: string,
    patch: Partial<ManualQaDraft>,
  ) {
    setManualQaDrafts((prev) => {
      const next = new Map(prev);
      const question = questions.find((item) => item.id === questionId);
      const current =
        next.get(questionId) ??
        (question ? createInitialManualQaDraft(question) : null);
      if (!current) return prev;
      next.set(questionId, { ...current, ...patch });
      return next;
    });
  }

  function addManualQaReport() {
    if (currentQuestion.type !== "MANUAL_QA_SANDBOX") return;

    const draft =
      manualQaDrafts.get(currentQuestion.id) ??
      createInitialManualQaDraft(currentQuestion);

    updateManualQaDraft(currentQuestion.id, {
      reports: [
        ...draft.reports,
        createEmptyManualQaReport(draft.reports.length + 1),
      ],
      noBugsFound: false,
      answerSaveStatus: "idle",
    });
  }

  function updateManualQaReport(
    reportId: string,
    patch: Partial<ManualQaBugReport>,
  ) {
    if (currentQuestion.type !== "MANUAL_QA_SANDBOX") return;

    const draft =
      manualQaDrafts.get(currentQuestion.id) ??
      createInitialManualQaDraft(currentQuestion);

    updateManualQaDraft(currentQuestion.id, {
      reports: draft.reports.map((report) =>
        report.id === reportId ? { ...report, ...patch } : report,
      ),
      noBugsFound: false,
      answerSaveStatus: "idle",
    });
  }

  function removeManualQaReport(reportId: string) {
    if (currentQuestion.type !== "MANUAL_QA_SANDBOX") return;

    const draft =
      manualQaDrafts.get(currentQuestion.id) ??
      createInitialManualQaDraft(currentQuestion);

    updateManualQaDraft(currentQuestion.id, {
      reports: draft.reports.filter((report) => report.id !== reportId),
      answerSaveStatus: "idle",
    });
  }

  function toggleManualQaNoBugs(value: boolean) {
    if (currentQuestion.type !== "MANUAL_QA_SANDBOX") return;

    updateManualQaDraft(currentQuestion.id, {
      noBugsFound: value,
      reports: value
        ? []
        : (manualQaDrafts.get(currentQuestion.id)?.reports ?? []),
      answerSaveStatus: "idle",
    });
  }

  function saveManualQaAnswer(
    question = currentQuestion,
    options: { timeSpentMs?: number } = {},
  ) {
    if (question.type !== "MANUAL_QA_SANDBOX") return;

    const draft =
      manualQaDrafts.get(question.id) ?? createInitialManualQaDraft(question);
    const timeSpentMs =
      typeof options.timeSpentMs === "number"
        ? options.timeSpentMs
        : Date.now() - enteredAtRef.current;

    if (typeof options.timeSpentMs !== "number") {
      enteredAtRef.current = Date.now();
    }

    setManualQaDrafts((prev) => {
      const next = new Map(prev);
      next.set(question.id, { ...draft, answerSaveStatus: "saving" });
      return next;
    });

    startTransition(() => {
      void submitManualQaAnswerAction({
        attemptId,
        questionId: question.id,
        reports: draft.reports,
        noBugsFound: draft.noBugsFound,
        timeSpentMs,
      }).then((result) => {
        if (!result?.ok) return;

        setManualQaDrafts((prev) => {
          const next = new Map(prev);
          const current = next.get(question.id) ?? draft;
          const hasAnswer = hasCompleteManualQaAnswer(current);
          next.set(question.id, {
            ...current,
            submissionCount: hasAnswer
              ? Math.max(1, current.submissionCount)
              : 0,
            answerSaveStatus: "saved",
          });
          return next;
        });
      });
    });
  }

  function submit(auto = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsSubmitDialogOpen(false);
    if (currentQuestion && getOpenQuizConfig(currentQuestion.apiConfig)) {
      saveOpenAnswer(currentQuestion);
    }
    if (currentQuestion?.type === "DEVTOOLS_SANDBOX") {
      saveDevtoolsAnswer(currentQuestion, { timeSpentMs: 0 });
    }
    if (currentQuestion?.type === "MANUAL_QA_SANDBOX") {
      saveManualQaAnswer(currentQuestion, { timeSpentMs: 0 });
    }
    flushCurrentTime();
    startTransition(() => {
      void submitAttemptAction({ attemptId, auto });
    });
  }

  function requestManualSubmit() {
    if (submittedRef.current || isPending) return;
    if (currentQuestion && getOpenQuizConfig(currentQuestion.apiConfig)) {
      saveOpenAnswer(currentQuestion);
    }
    if (currentQuestion?.type === "DEVTOOLS_SANDBOX") {
      saveDevtoolsAnswer(currentQuestion, { timeSpentMs: 0 });
    }
    if (currentQuestion?.type === "MANUAL_QA_SANDBOX") {
      saveManualQaAnswer(currentQuestion, { timeSpentMs: 0 });
    }
    setIsSubmitDialogOpen(true);
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
    return () => {
      if (!submittedRef.current) {
        flushCurrentTime();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  useEffect(() => {
    return () => {
      if (devtoolsAutosaveRef.current) {
        window.clearTimeout(devtoolsAutosaveRef.current);
      }
    };
  }, []);

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  const currentApiDraft =
    currentQuestion.type === "API_SANDBOX" ||
    currentQuestion.type === "DEVTOOLS_SANDBOX"
      ? (apiDrafts.get(currentQuestion.id) ??
        createInitialApiDraft(currentQuestion))
      : null;
  const currentSqlDraft =
    currentQuestion.type === "SQL_SANDBOX"
      ? (sqlDrafts.get(currentQuestion.id) ?? createInitialSqlDraft(currentQuestion))
      : null;
  const currentSqlConfig =
    currentQuestion.type === "SQL_SANDBOX"
      ? getSqlConfig(currentQuestion)
      : null;
  const currentSqlTable =
    currentQuestion.type === "SQL_SANDBOX" && currentSqlConfig
      ? currentSqlConfig.tables.find(
          (table) =>
            table.name ===
            (selectedSqlTables.get(currentQuestion.id) ??
              currentSqlConfig.tables[0]?.name ??
              ""),
        ) ?? currentSqlConfig.tables[0]
      : null;
  const currentManualQaDraft =
    currentQuestion.type === "MANUAL_QA_SANDBOX"
      ? (manualQaDrafts.get(currentQuestion.id) ??
        createInitialManualQaDraft(currentQuestion))
      : null;
  const currentManualQaConfig =
    currentQuestion.type === "MANUAL_QA_SANDBOX"
      ? getManualQaSandboxConfig(currentQuestion.apiConfig)
      : null;
  const currentDevtoolsConfig =
    currentQuestion.type === "DEVTOOLS_SANDBOX"
      ? getDevtoolsConfig(currentQuestion)
      : null;

  return (
    <main
      className={`page test-page-compact stack-lg ${
        currentQuestion.type === "SQL_SANDBOX"
          ? "test-page-sql"
          : currentQuestion.type === "MANUAL_QA_SANDBOX"
          ? "manual-qa-test-page"
          : ""
      }`}
    >
      <section
        className={`grid-2 ${
          currentQuestion.type === "SQL_SANDBOX" ? "test-layout-sql" : ""
        }`}
      >
        <Card className={currentQuestion.type === "SQL_SANDBOX" ? "sql-main-card" : undefined}>
          <CardHeader className="test-card-header">
            <div
              className="nav-row"
              style={{ justifyContent: "space-between" }}
            >
              <div className="nav-row">
                <span className={currentTrack.className}>
                  {currentTrack.label}
                </span>
                <span className="type-chip">
                  {currentQuestion.type === "DEVTOOLS_SANDBOX"
                    ? "DevTools"
                    : currentQuestion.type === "API_SANDBOX"
                      ? "API Sandbox"
                      : currentQuestion.type === "SQL_SANDBOX"
                        ? "SQL Sandbox"
                      : currentQuestion.type === "MANUAL_QA_SANDBOX"
                        ? "Manual QA"
                        : "Quiz"}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCommentDialogOpen(true)}
              >
                <MessageSquare size={16} />
                {currentQuestionComment.trim()
                  ? "Комментарий"
                  : "Комментировать"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="test-card-content stack">
            <CardTitle>
              {currentIndex + 1}. {currentQuestion.text}
            </CardTitle>
            {currentQuestion.explanation ? (
              <p className="body-2 muted m-0">{currentQuestion.explanation}</p>
            ) : null}

            {currentQuestion.type === "QUIZ" ? (
              <>
                {getOpenQuizConfig(currentQuestion.apiConfig) ? (
                  <div className="stack">
                    <div className="form-grid">
                      <LabelLike>
                        {getOpenQuizConfig(currentQuestion.apiConfig)
                          ?.answerLabel || "Введите ответ"}
                      </LabelLike>
                      <Textarea
                        data-track="open-quiz-answer"
                        onBlur={() => saveOpenAnswer()}
                        onChange={(event) =>
                          updateOpenAnswer(event.target.value)
                        }
                        placeholder={
                          getOpenQuizConfig(currentQuestion.apiConfig)
                            ?.placeholder || "Опишите ответ своими словами"
                        }
                        value={textAnswers.get(currentQuestion.id) ?? ""}
                      />
                    </div>
                    <div
                      className="nav-row"
                      style={{ justifyContent: "space-between" }}
                    >
                      <Button
                        disabled={
                          isPending ||
                          !(textAnswers.get(currentQuestion.id) ?? "").trim()
                        }
                        onClick={() => saveOpenAnswer()}
                        type="button"
                      >
                        Сохранить ответ
                      </Button>
                      {(textAnswers.get(currentQuestion.id) ?? "").trim() ? (
                        <Badge variant="muted">ответ заполнен</Badge>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="stack">
                    {currentQuestion.options.map((option) => {
                      const selected =
                        answers.get(currentQuestion.id) === option.id;
                      return (
                        <button
                          className={`test-answer-option ${selected ? "selected" : ""}`}
                          data-track={`answer-${option.label}`}
                          key={option.id}
                          onClick={() => selectOption(option.id)}
                          type="button"
                        >
                          <span className="test-answer-radio" />
                          <span>
                            <strong>{option.label}.</strong> {option.text}
                          </span>
                          <small>{option.label}</small>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : currentSqlDraft && currentSqlConfig ? (
              <div className="sql-workspace">
                <div className="sql-center-column stack">
                  <div className="surface sql-editor-panel stack">
                    <div
                      className="nav-row"
                      style={{ justifyContent: "space-between" }}
                    >
                      <div className="stack" style={{ gap: 8 }}>
                        <strong>SQL Query</strong>
                        <div className="nav-row">
                          <span className="type-chip">{currentSqlConfig.dialect}</span>
                          {currentSqlConfig.expectedResult.columns.map((column) => (
                            <span className="type-chip" key={column}>
                              {column}
                            </span>
                          ))}
                        </div>
                      </div>
                      {currentSqlDraft.submissionCount > 0 ? (
                        <Badge
                          variant={currentSqlDraft.isCorrect ? "success" : "warning"}
                        >
                          {currentSqlDraft.isCorrect ? "зачтено" : "нужно исправить"}
                        </Badge>
                      ) : (
                        <Badge variant="muted">есть результат</Badge>
                      )}
                    </div>

                    <Textarea
                      className="sql-editor"
                      data-track="sql-query"
                      onChange={(event) =>
                        updateSqlDraft(currentQuestion.id, {
                          query: event.target.value,
                        })
                      }
                      placeholder="Введите SQL-запрос"
                      value={currentSqlDraft.query}
                    />

                    <div
                      className="nav-row"
                      style={{ justifyContent: "space-between" }}
                    >
                      <div className="nav-row">
                        <Button
                          disabled={isPending || !currentSqlDraft.query.trim()}
                          onClick={runSqlQuery}
                          type="button"
                        >
                          <Send size={18} />
                          Выполнить
                        </Button>
                        <span className="body-2 muted">
                          Запусков: {currentSqlDraft.submissionCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="surface sql-result-panel stack">
                    <div
                      className="nav-row"
                      style={{ justifyContent: "space-between" }}
                    >
                      <strong>Результат запроса</strong>
                      {currentSqlDraft.response?.rows ? (
                        <Badge variant="success">
                          {currentSqlDraft.response.rows.length} rows
                        </Badge>
                      ) : null}
                    </div>

                    {currentSqlDraft.response?.error ? (
                      <div className="soft-panel" style={{ color: "var(--destructive)" }}>
                        {currentSqlDraft.response.error}
                      </div>
                    ) : currentSqlDraft.response &&
                      currentSqlDraft.response.columns.length > 0 ? (
                      <div className="sql-result-table table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              {currentSqlDraft.response.columns.map((column) => (
                                <th key={column}>{column}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {currentSqlDraft.response.rows.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.map((value, columnIndex) => (
                                  <td key={`${rowIndex}-${columnIndex}`}>
                                    {value === null ? "NULL" : String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="body-2 muted m-0">
                        Здесь будет результат вашего SQL-запроса.
                      </p>
                    )}
                  </div>
                </div>

                <div className="surface sql-schema-panel stack">
                  <div
                    className="nav-row"
                    style={{ justifyContent: "space-between" }}
                  >
                    <strong>Связанные таблицы</strong>
                    <Badge variant="muted">{currentSqlConfig.tables.length}</Badge>
                  </div>

                  <div className="sql-table-tabs">
                    {currentSqlConfig.tables.map((table) => {
                      const active = currentSqlTable?.name === table.name;
                      return (
                        <Button
                          className={`sql-table-tab ${active ? "active" : ""}`}
                          key={table.name}
                          onClick={() =>
                            setSelectedSqlTables((prev) => {
                              const next = new Map(prev);
                              next.set(currentQuestion.id, table.name);
                              return next;
                            })
                          }
                          type="button"
                          variant={active ? "default" : "secondary"}
                        >
                          {table.name}
                        </Button>
                      );
                    })}
                  </div>

                  {currentSqlTable ? (
                    <div className="soft-panel stack">
                      <div
                        className="nav-row"
                        style={{ justifyContent: "space-between" }}
                      >
                        <strong>{currentSqlTable.name}</strong>
                        <Badge variant="muted">
                          {currentSqlTable.rows.length} rows
                        </Badge>
                      </div>

                      <div className="stack">
                        <p className="body-2 muted m-0">Поля таблицы</p>
                        <div className="stack">
                          {currentSqlTable.columns.map((column) => (
                            <div
                              className="surface nav-row"
                              key={column.name}
                              style={{ justifyContent: "space-between", padding: "16px 18px" }}
                            >
                              <strong>{column.name}</strong>
                              <span className="body-2 muted">{column.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="stack">
                        <p className="body-2 muted m-0">Пример данных</p>
                        <div className="sql-table-preview table-wrap">
                          <table className="table">
                            <thead>
                              <tr>
                                {currentSqlTable.columns.map((column) => (
                                  <th key={column.name}>{column.name}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {currentSqlTable.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {currentSqlTable.columns.map((column) => (
                                    <td key={`${rowIndex}-${column.name}`}>
                                      {row[column.name] === null
                                        ? "NULL"
                                        : String(row[column.name] ?? "")}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : currentManualQaDraft && currentManualQaConfig ? (
              <div className="manual-qa-task-layout">
                <div className="manual-qa-task-app">
                  <ManualQaPresetRenderer
                    appPreset={currentManualQaConfig.appPreset}
                  />
                </div>

                <div className="manual-qa-report-panel">
                  <div
                    className="nav-row"
                    style={{ justifyContent: "space-between" }}
                  >
                    <div>
                      <strong>Баг-репорты</strong>
                      <p className="body-2 muted m-0">
                        Заполняйте только дефекты, которые смогли воспроизвести
                        в miniapp.
                      </p>
                    </div>
                    <Badge variant="muted">
                      {currentManualQaDraft.reports.length}
                    </Badge>
                  </div>

                  <label className="manual-qa-no-bugs">
                    <input
                      checked={currentManualQaDraft.noBugsFound}
                      onChange={(event) =>
                        toggleManualQaNoBugs(event.target.checked)
                      }
                      type="checkbox"
                    />
                    <span>
                      <strong>Баги не найдены</strong>
                      <small>
                        Используйте только если осознанно завершили проверку без
                        дефектов.
                      </small>
                    </span>
                  </label>

                  {!currentManualQaDraft.noBugsFound ? (
                    <div className="stack">
                      {currentManualQaDraft.reports.map((report, index) => (
                        <div className="manual-qa-report-card" key={report.id}>
                          <div
                            className="nav-row"
                            style={{ justifyContent: "space-between" }}
                          >
                            <strong>Баг {index + 1}</strong>
                            <Button
                              aria-label="Удалить баг-репорт"
                              onClick={() => removeManualQaReport(report.id)}
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>

                          <div className="form-grid">
                            <LabelLike>Название</LabelLike>
                            <Input
                              onChange={(event) =>
                                updateManualQaReport(report.id, {
                                  title: event.target.value,
                                })
                              }
                              placeholder="Например: промокод применяется повторно"
                              value={report.title}
                            />
                          </div>

                          <div className="grid-2">
                            <div className="form-grid">
                              <LabelLike>Severity</LabelLike>
                              <Select
                                onChange={(event) =>
                                  updateManualQaReport(report.id, {
                                    severity: event.target
                                      .value as ManualQaBugReport["severity"],
                                  })
                                }
                                value={report.severity}
                              >
                                <option value="blocker">blocker</option>
                                <option value="critical">critical</option>
                                <option value="major">major</option>
                                <option value="minor">minor</option>
                                <option value="trivial">trivial</option>
                              </Select>
                            </div>
                            <div className="form-grid">
                              <LabelLike>Category</LabelLike>
                              <Select
                                onChange={(event) =>
                                  updateManualQaReport(report.id, {
                                    category: event.target.value,
                                  })
                                }
                                value={report.category}
                              >
                                {currentManualQaConfig.bugCategories.map(
                                  (category) => (
                                    <option key={category} value={category}>
                                      {category}
                                    </option>
                                  ),
                                )}
                              </Select>
                            </div>
                          </div>

                          <div className="form-grid">
                            <LabelLike>Steps to reproduce</LabelLike>
                            <Textarea
                              onChange={(event) =>
                                updateManualQaReport(report.id, {
                                  steps: event.target.value,
                                })
                              }
                              placeholder={"1. Открыть ClickAvto\n2. ..."}
                              value={report.steps}
                            />
                          </div>

                          <div className="grid-2">
                            <div className="form-grid">
                              <LabelLike>Actual result</LabelLike>
                              <Textarea
                                onChange={(event) =>
                                  updateManualQaReport(report.id, {
                                    actual: event.target.value,
                                  })
                                }
                                placeholder="Что произошло фактически"
                                value={report.actual}
                              />
                            </div>
                            <div className="form-grid">
                              <LabelLike>Expected result</LabelLike>
                              <Textarea
                                onChange={(event) =>
                                  updateManualQaReport(report.id, {
                                    expected: event.target.value,
                                  })
                                }
                                placeholder="Как должно быть"
                                value={report.expected}
                              />
                            </div>
                          </div>

                          <div className="form-grid">
                            <LabelLike>Note</LabelLike>
                            <Input
                              onChange={(event) =>
                                updateManualQaReport(report.id, {
                                  note: event.target.value,
                                })
                              }
                              placeholder="Необязательно: устройство, сеть, доп. контекст"
                              value={report.note ?? ""}
                            />
                          </div>
                        </div>
                      ))}

                      <Button
                        onClick={addManualQaReport}
                        type="button"
                        variant="secondary"
                      >
                        <Plus size={18} />
                        Добавить баг
                      </Button>
                    </div>
                  ) : null}

                  <div
                    className="nav-row"
                    style={{ justifyContent: "space-between" }}
                  >
                    <Badge variant="muted">
                      {currentManualQaDraft.answerSaveStatus === "saving"
                        ? "сохраняем"
                        : currentManualQaDraft.answerSaveStatus === "saved"
                          ? "ответ сохранён"
                          : "есть несохранённые изменения"}
                    </Badge>
                    <Button
                      disabled={isPending}
                      onClick={() => saveManualQaAnswer()}
                      type="button"
                    >
                      Сохранить ответ
                    </Button>
                  </div>
                </div>
              </div>
            ) : currentApiDraft && currentDevtoolsConfig ? (
              <div className="stack">
                <div className="soft-panel stack">
                  <div
                    className="nav-row"
                    style={{ justifyContent: "space-between" }}
                  >
                    <div>
                      <p className="body-2 muted m-0">
                        Запрос для проверки в DevTools
                      </p>
                      <strong>
                        {(currentDevtoolsConfig.method || "GET").toUpperCase()}{" "}
                        {
                          buildDevtoolsEndpoint(
                            attemptId,
                            currentQuestion,
                            currentDevtoolsConfig,
                          ).split("?")[0]
                        }
                      </strong>
                    </div>
                    {currentApiDraft.requestSent ? (
                      <Badge variant="success">запрос отправлен</Badge>
                    ) : null}
                  </div>
                  <Button
                    data-track="devtools-request-button"
                    disabled={isPending}
                    onClick={sendDevtoolsRequest}
                    type="button"
                  >
                    <Send size={18} />
                    {currentDevtoolsConfig.buttonLabel || "Отправить запрос"}
                  </Button>
                </div>

                <div className="form-grid">
                  <LabelLike>
                    {currentDevtoolsConfig.answerLabel ||
                      `Введите значение ${currentDevtoolsConfig.answerPath || "параметра"} из response`}
                  </LabelLike>
                  <Input
                    data-track="devtools-answer"
                    onChange={(event) =>
                      updateDevtoolsAnswer(event.target.value)
                    }
                    onPaste={pasteDevtoolsAnswer}
                    placeholder={currentDevtoolsConfig.answerPath || "message"}
                    value={currentApiDraft.devtoolsAnswer}
                  />
                </div>

                <div
                  className="nav-row"
                  style={{ justifyContent: "space-between" }}
                >
                  <Badge variant="muted">
                    {currentApiDraft.answerSaveStatus === "saving"
                      ? "сохраняем ответ"
                      : currentApiDraft.submissionCount > 0
                        ? "ответ сохранён"
                        : "ответ сохранится автоматически"}
                  </Badge>
                </div>
              </div>
            ) : currentApiDraft ? (
              <div className="stack">
                <div className="grid-2">
                  <div className="form-grid">
                    <LabelLike>Method</LabelLike>
                    <Select
                      value={currentApiDraft.method}
                      onChange={(event) =>
                        updateApiDraft({ method: event.target.value })
                      }
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
                      onChange={(event) =>
                        updateApiDraft({ url: event.target.value })
                      }
                      placeholder="/users?status=active"
                      value={currentApiDraft.url}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <LabelLike>Headers</LabelLike>
                  <Textarea
                    data-track="api-headers"
                    onChange={(event) =>
                      updateApiDraft({ headersText: event.target.value })
                    }
                    placeholder={
                      "Authorization: Bearer test-token\nContent-Type: application/json"
                    }
                    value={currentApiDraft.headersText}
                  />
                </div>

                <div className="form-grid">
                  <LabelLike>JSON Body</LabelLike>
                  <Textarea
                    data-track="api-body"
                    onChange={(event) =>
                      updateApiDraft({ bodyText: event.target.value })
                    }
                    placeholder={'{\n  "name": "Ali Valiyev"\n}'}
                    value={currentApiDraft.bodyText}
                  />
                </div>

                <div
                  className="nav-row"
                  style={{ justifyContent: "space-between" }}
                >
                  <div className="nav-row">
                    <Button
                      type="button"
                      onClick={sendApiRequest}
                      disabled={isPending}
                    >
                      <Send size={18} />
                      Send
                    </Button>
                    <span className="body-2 muted">
                      Отправок: {currentApiDraft.submissionCount}
                    </span>
                  </div>
                  {currentApiDraft.submissionCount > 0 ? (
                    <Badge
                      variant={
                        currentApiDraft.isCorrect ? "success" : "warning"
                      }
                    >
                      {currentApiDraft.isCorrect
                        ? "зачтено"
                        : "нужно исправить"}
                    </Badge>
                  ) : null}
                </div>

                {currentApiDraft.response ? (
                  <div className="soft-panel stack">
                    <div
                      className="nav-row"
                      style={{ justifyContent: "space-between" }}
                    >
                      <strong>Response</strong>
                      <Badge
                        variant={
                          currentApiDraft.response.status < 400
                            ? "success"
                            : "danger"
                        }
                      >
                        {currentApiDraft.response.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="body-2 muted m-0">Headers</p>
                      <pre className="body-2 m-0 whitespace-pre-wrap">
                        {JSON.stringify(
                          currentApiDraft.response.headers,
                          null,
                          2,
                        )}
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

            <div className="test-question-footer">
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
                  disabled={isLastQuestion}
                >
                  Далее
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="stack">
          <Card className={currentQuestion.type === "SQL_SANDBOX" ? "test-nav-card-sql" : undefined}>
            <CardHeader className="test-card-header">
              <div
                className="nav-row"
                style={{ justifyContent: "space-between" }}
              >
                <CardTitle>Навигация</CardTitle>
                <span className="timer-pill compact" suppressHydrationWarning>
                  <Clock3 size={16} />
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="test-card-content stack">
              <div className="test-nav-summary">
                <div>
                  <strong>
                    Вопрос {currentIndex + 1} из {questions.length}
                  </strong>
                  <span>Можно возвращаться до истечения времени.</span>
                </div>
                <Progress value={progress} />
              </div>
              <div
                className={
                  currentQuestion.type === "SQL_SANDBOX"
                    ? "question-grid question-grid-sql"
                    : "question-grid"
                }
              >
                {questions.map((question, index) => {
                  const done =
                    question.type === "API_SANDBOX" ||
                    question.type === "DEVTOOLS_SANDBOX" ||
                    question.type === "SQL_SANDBOX"
                      ? question.type === "SQL_SANDBOX"
                        ? (sqlDrafts.get(question.id)?.submissionCount ?? 0) > 0
                        : (apiDrafts.get(question.id)?.submissionCount ?? 0) > 0
                      : question.type === "MANUAL_QA_SANDBOX"
                        ? hasCompleteManualQaAnswer(
                            manualQaDrafts.get(question.id),
                          )
                        : Boolean(answers.get(question.id));
                  const active = index === currentIndex;
                  const commented = Boolean(
                    commentDrafts.get(question.id)?.trim(),
                  );
                  return (
                    <button
                      className={`question-dot ${
                        currentQuestion.type === "SQL_SANDBOX"
                          ? "question-dot-sql"
                          : ""
                      } ${done ? "done" : ""} ${
                        commented ? "commented" : ""
                      } ${active ? "active" : ""}`}
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
                Отмечено {answeredCount} из {questions.length}. Для sandbox-задач
                прогресс появляется после отправки ответа на проверку.
              </p>
              <div className="question-nav-legend">
                <span>
                  <i className="legend-dot answered" />
                  Отвечено · {answeredCount}
                </span>
                <span>
                  <i className="legend-dot commented" />
                  Комментарии · {commentedCount}
                </span>
                <span>
                  <i className="legend-dot empty" />
                  Без ответа · {questions.length - answeredCount}
                </span>
              </div>
              <div className="test-submit-control compact">
                <Button
                  type="button"
                  variant="outline"
                  onClick={requestManualSubmit}
                  disabled={isPending}
                  className="test-nav-submit"
                >
                  <Send size={18} />
                  Завершить
                </Button>
                <div className="submit-info-bubble compact" role="note">
                  <Info size={16} />
                  <span>Неотвеченные вопросы будут засчитаны как fail.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {remainingMs < 60_000 ? (
            <div
              className="soft-panel nav-row"
              style={{ color: "var(--destructive)" }}
            >
              <AlertTriangle size={18} />
              <strong>Осталось меньше минуты</strong>
            </div>
          ) : null}
        </div>
      </section>

      {isSubmitDialogOpen ? (
        <div
          aria-labelledby="finish-test-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setIsSubmitDialogOpen(false)}
        >
          <div
            className="confirm-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="stack">
              <div className="nav-row">
                <span className="confirm-dialog-icon">
                  <AlertTriangle size={20} />
                </span>
                <h2 className="head-3 m-0" id="finish-test-title">
                  Завершить тест?
                </h2>
              </div>
              <p className="body-1 muted m-0">
                После подтверждения тест будет отправлен на проверку. Все
                вопросы без ответа будут засчитаны как fail.
              </p>
              <div className="confirm-dialog-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSubmitDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  onClick={() => submit(false)}
                  disabled={isPending}
                >
                  Продолжить
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isCommentDialogOpen ? (
        <div
          aria-labelledby="question-comment-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setIsCommentDialogOpen(false)}
        >
          <div
            className="confirm-dialog question-comment-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="stack">
              <div
                className="nav-row"
                style={{ justifyContent: "space-between" }}
              >
                <div className="nav-row">
                  <span className="confirm-dialog-icon">
                    <MessageSquare size={20} />
                  </span>
                  <h2 className="head-3 m-0" id="question-comment-title">
                    Комментарий к вопросу
                  </h2>
                </div>
                <Badge variant="muted">
                  {currentCommentSaveStatus === "saving"
                    ? "сохраняем"
                    : currentCommentSaveStatus === "saved"
                      ? "сохранено"
                      : "черновик"}
                </Badge>
              </div>
              <p className="body-2 muted m-0">
                Напишите, что должен увидеть ревьювер: например, нет корректного
                ответа, фото не грузится или условие сформулировано
                неоднозначно.
              </p>
              <Textarea
                autoFocus
                maxLength={1000}
                onChange={(event) => updateQuestionComment(event.target.value)}
                placeholder="Например: нет правильного ответа, потому что..."
                value={currentQuestionComment}
              />
              <div className="confirm-dialog-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCommentDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  type="button"
                  onClick={saveQuestionComment}
                  disabled={isPending || currentCommentSaveStatus === "saving"}
                >
                  Сохранить
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function LabelLike({ children }: { children: ReactNode }) {
  return <span className="body-2 muted">{children}</span>;
}
