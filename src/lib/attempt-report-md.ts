import { stringifyPrettyJson } from "@/lib/api-sandbox";
import { getAiAnswerReview } from "@/lib/ai-answer-review";
import { getInternComment } from "@/lib/answer-comment";
import {
  getAutotestAnswerPayload,
  getAutotestSandboxConfig,
} from "@/lib/autotest-sandbox";
import {
  getManualQaAnswerPayload,
  getManualQaSandboxConfig,
} from "@/lib/manual-qa-sandbox";
import { getOpenQuizConfig } from "@/lib/open-quiz";
import { prisma } from "@/lib/prisma";
import { getSqlSandboxConfig } from "@/lib/sql-sandbox-config";
import { formatDuration, formatPercent } from "@/lib/utils";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return null;

  return value.toISOString();
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Zа-яА-Я0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function markdownText(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function tableCell(value: unknown) {
  return markdownText(value).replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

function codeBlock(value: unknown, language = "") {
  const text =
    typeof value === "string" ? value : stringifyPrettyJson(value) || "null";

  return `\`\`\`${language}\n${text.replaceAll("```", "``\\`")}\n\`\`\``;
}

function bullet(label: string, value: unknown) {
  const normalized =
    value === null || typeof value === "undefined" ? "" : value;
  return `- ${label}: ${tableCell(normalized) || "null"}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function getAttemptReportData(attemptId: string) {
  return prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      internProfile: { include: { profile: true, track: true, wave: true } },
      track: true,
      wave: true,
      answers: {
        include: {
          question: { include: { trackRef: true, options: { orderBy: { order: "asc" } } } },
          selectedOption: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

type AttemptReportData = NonNullable<
  Awaited<ReturnType<typeof getAttemptReportData>>
>;
type AttemptAnswer = AttemptReportData["answers"][number];

function getQuestionResult(answer: AttemptAnswer) {
  if (getOpenQuizConfig(answer.question.apiConfig)) {
    return "manual_review";
  }

  if (
    answer.question.type === "MANUAL_QA_SANDBOX" ||
    answer.question.type === "AUTOTEST_SANDBOX"
  ) {
    return "manual_review";
  }

  return answer.isCorrect ? "correct" : "incorrect";
}

function getSelectedOptionSummary(answer: AttemptAnswer) {
  if (!answer.selectedOption) return null;

  return {
    id: answer.selectedOption.id,
    label: answer.selectedOption.label,
    text: answer.selectedOption.text,
    isCorrect: answer.selectedOption.isCorrect,
    order: answer.selectedOption.order,
  };
}

function getOpenTextAnswer(answer: AttemptAnswer) {
  if (!getOpenQuizConfig(answer.question.apiConfig)) return null;

  return isRecord(answer.apiRequest)
    ? String(answer.apiRequest.answerText ?? "")
    : "";
}

function renderManualQaAnswer(answer: AttemptAnswer) {
  const payload = getManualQaAnswerPayload(answer.apiRequest);
  const config = getManualQaSandboxConfig(answer.question.apiConfig);
  const response = isRecord(answer.apiResponse) ? answer.apiResponse : null;
  const matchedKnownBugIds = Array.isArray(response?.matchedKnownBugIds)
    ? response.matchedKnownBugIds.map((item) => String(item))
    : [];

  const lines = [
    "#### Manual QA Payload",
    "",
    bullet("preset", config?.appPreset ?? "unknown"),
    bullet("scenario_title", config?.scenarioTitle ?? ""),
    bullet("no_bugs_found", payload?.noBugsFound ?? false),
    bullet("report_count", payload?.reports.length ?? 0),
    bullet("known_bugs_total", config?.knownBugs.length ?? 0),
    bullet("matched_known_bug_ids", matchedKnownBugIds.join(", ")),
    "",
  ];

  if (config?.knownBugs.length) {
    lines.push("##### Known Bugs Rubric", "");
    for (const knownBug of config.knownBugs) {
      lines.push(
        `- ${knownBug.id}: ${knownBug.title} (${knownBug.severity}); keywords: ${knownBug.matchKeywords.join(
          ", ",
        )}`,
      );
    }
    lines.push("");
  }

  if (!payload) {
    lines.push("Manual QA answer is not filled.", "");
    return lines.join("\n");
  }

  if (payload.reports.length > 0) {
    lines.push("##### Intern Bug Reports", "");
    payload.reports.forEach((report, reportIndex) => {
      lines.push(
        `###### Report ${reportIndex + 1}: ${markdownText(report.title) || "untitled"}`,
        "",
        bullet("id", report.id),
        bullet("severity", report.severity),
        bullet("category", report.category),
        "",
        "Steps to reproduce:",
        codeBlock(report.steps),
        "",
        "Actual result:",
        codeBlock(report.actual),
        "",
        "Expected result:",
        codeBlock(report.expected),
        "",
      );

      if (report.note) {
        lines.push("Note:", codeBlock(report.note), "");
      }
    });
  }

  return lines.join("\n");
}

function renderAnswerDetails(answer: AttemptAnswer) {
  if (answer.question.type === "MANUAL_QA_SANDBOX") {
    return renderManualQaAnswer(answer);
  }

  if (answer.question.type === "AUTOTEST_SANDBOX") {
    const payload = getAutotestAnswerPayload(answer.apiRequest);
    const config = getAutotestSandboxConfig(answer.question.apiConfig);

    return [
      "#### Autotest Payload",
      "",
      bullet("scenario_title", config?.scenarioTitle ?? ""),
      bullet("preset", config?.appPreset ?? "unknown"),
      bullet("expected_scenarios_total", config?.expectedScenarios.length ?? 0),
      "",
      "Submitted pseudocode:",
      codeBlock(payload?.code ?? ""),
      "",
      "Stored evaluation:",
      codeBlock(answer.apiResponse, "json"),
      "",
      "Expected scenarios:",
      codeBlock(config?.expectedScenarios ?? [], "json"),
      "",
    ].join("\n");
  }

  if (answer.question.type === "SQL_SANDBOX") {
    const config = getSqlSandboxConfig(answer.question.apiConfig);

    return [
      "#### SQL Payload",
      "",
      bullet("task_title", config?.taskTitle ?? ""),
      bullet("dialect", config?.dialect ?? ""),
      "",
      "Submitted query:",
      codeBlock(isRecord(answer.apiRequest) ? answer.apiRequest.query : ""),
      "",
      "Execution result:",
      codeBlock(answer.apiResponse, "json"),
      "",
      "Expected result:",
      codeBlock(config?.expectedResult ?? null, "json"),
      "",
    ].join("\n");
  }

  if (
    answer.question.type === "API_SANDBOX" ||
    answer.question.type === "DEVTOOLS_SANDBOX"
  ) {
    return [
      "#### API Data",
      "",
      bullet("submission_count", answer.submissionCount),
      "",
      "Stored request:",
      codeBlock(answer.apiRequest, "json"),
      "",
      "Stored response:",
      codeBlock(answer.apiResponse, "json"),
      "",
    ].join("\n");
  }

  const openTextAnswer = getOpenTextAnswer(answer);
  if (openTextAnswer !== null) {
    return ["#### Open Text Answer", "", codeBlock(openTextAnswer), ""].join(
      "\n",
    );
  }

  return [
    "#### Selected Option",
    "",
    codeBlock(getSelectedOptionSummary(answer), "json"),
    "",
  ].join("\n");
}

function getAdminReview(value: unknown) {
  if (!isRecord(value) || !isRecord(value.adminReview)) return null;
  return value.adminReview;
}

function buildMachineSummary(
  attempt: AttemptReportData,
  totalTimeMs: number,
  answerTimeMs: number,
  averageQuestionTimeMs: number,
) {
  return {
    schema: "assessment_attempt_markdown_v1",
    generatedAt: new Date().toISOString(),
    attempt: {
      id: attempt.id,
      status: attempt.status,
      startedAt: formatDateTime(attempt.startedAt),
      submittedAt: formatDateTime(attempt.submittedAt),
      deadlineAt: formatDateTime(attempt.deadlineAt),
      totalTimeMs,
      answerTimeMs,
      averageQuestionTimeMs,
      scorePercent: attempt.scorePercent ?? 0,
      correctCount: attempt.correctCount,
      questionCount: attempt.questionCount,
    },
    intern: {
      id: attempt.internProfile.id,
      fullName: attempt.internProfile.fullName,
      profileId: attempt.internProfile.profileId,
      source: attempt.internProfile.source,
      track: attempt.track?.name ?? attempt.internProfile.track?.name ?? null,
      wave: attempt.wave?.name ?? attempt.internProfile.wave?.name ?? null,
    },
    answers: attempt.answers.map((answer, index) => ({
      index: index + 1,
      answerId: answer.id,
      questionId: answer.questionId,
      type: answer.question.type,
      track: answer.question.trackRef?.name ?? answer.question.track,
      prompt: answer.question.text,
      result: getQuestionResult(answer),
      isCorrect: answer.isCorrect,
      timeSpentMs: answer.timeSpentMs,
      visits: answer.visits,
      submissionCount: answer.submissionCount,
      answeredAt: formatDateTime(answer.answeredAt),
      internComment: getInternComment(answer.apiRequest) || null,
      adminReview: getAdminReview(answer.apiResponse),
      aiReview: getAiAnswerReview(answer.apiResponse),
      selectedOption: getSelectedOptionSummary(answer),
      openTextAnswer: getOpenTextAnswer(answer),
      manualQa: getManualQaAnswerPayload(answer.apiRequest),
      autotest: getAutotestAnswerPayload(answer.apiRequest),
      sql:
        answer.question.type === "SQL_SANDBOX"
          ? {
              request: answer.apiRequest,
              response: answer.apiResponse,
            }
          : null,
    })),
  };
}

export async function generateAttemptReportMarkdown(attemptId: string) {
  const attempt = await getAttemptReportData(attemptId);
  if (!attempt) return null;

  const score = attempt.scorePercent ?? 0;
  const answerTimeMs = attempt.answers.reduce(
    (sum, answer) => sum + answer.timeSpentMs,
    0,
  );
  const totalTimeMs =
    typeof attempt.totalTimeSeconds === "number"
      ? attempt.totalTimeSeconds * 1000
      : Math.max(
          0,
          (attempt.submittedAt?.getTime() ?? Date.now()) -
            attempt.startedAt.getTime(),
        );
  const averageQuestionTimeMs =
    attempt.questionCount > 0
      ? Math.round(answerTimeMs / attempt.questionCount)
      : 0;
  const machineSummary = buildMachineSummary(
    attempt,
    totalTimeMs,
    answerTimeMs,
    averageQuestionTimeMs,
  );

  const lines = [
    "# Assessment Attempt Report",
    "",
    "> Machine-readable Markdown report for LLM analysis.",
    "",
    "## Metadata",
    "",
    bullet("schema", "assessment_attempt_markdown_v1"),
    bullet("generated_at", machineSummary.generatedAt),
    bullet("attempt_id", attempt.id),
    bullet("candidate_name", attempt.internProfile.fullName),
    bullet("intern_profile_id", attempt.internProfile.id),
    bullet("track", attempt.track?.name ?? attempt.internProfile.track?.name),
    bullet("wave", attempt.wave?.name ?? attempt.internProfile.wave?.name),
    bullet("status", attempt.status),
    bullet("started_at", formatDateTime(attempt.startedAt)),
    bullet("submitted_at", formatDateTime(attempt.submittedAt)),
    bullet("deadline_at", formatDateTime(attempt.deadlineAt)),
    "",
    "## Score And Timing",
    "",
    bullet("score_percent", formatPercent(score)),
    bullet("score_percent_raw", score),
    bullet("correct_count", attempt.correctCount),
    bullet("question_count", attempt.questionCount),
    bullet("total_time", formatDuration(totalTimeMs)),
    bullet("total_time_ms", totalTimeMs),
    bullet("answer_time_ms", answerTimeMs),
    bullet("average_question_time", formatDuration(averageQuestionTimeMs)),
    bullet("average_question_time_ms", averageQuestionTimeMs),
    "",
    "## Machine Summary JSON",
    "",
    codeBlock(machineSummary, "json"),
    "",
    "## Questions",
    "",
  ];

  attempt.answers.forEach((answer, index) => {
    const internComment = getInternComment(answer.apiRequest);

    lines.push(
      `### Q${index + 1}: ${markdownText(answer.question.text)}`,
      "",
      bullet("answer_id", answer.id),
      bullet("question_id", answer.questionId),
      bullet("type", answer.question.type),
      bullet("track", answer.question.trackRef?.name ?? answer.question.track),
      bullet("result", getQuestionResult(answer)),
      bullet("is_correct", answer.isCorrect),
      bullet("time_spent", formatDuration(answer.timeSpentMs)),
      bullet("time_spent_ms", answer.timeSpentMs),
      bullet("visits", answer.visits),
      bullet("submission_count", answer.submissionCount),
      bullet("answered_at", formatDateTime(answer.answeredAt)),
      "",
    );

    if (answer.question.explanation) {
      lines.push(
        "#### Admin Explanation",
        "",
        codeBlock(answer.question.explanation),
        "",
      );
    }

    if (internComment) {
      lines.push("#### Intern Comment", "", codeBlock(internComment), "");
    }

    const aiReview = getAiAnswerReview(answer.apiResponse);
    if (aiReview) {
      lines.push("#### AI Review", "", codeBlock(aiReview, "json"), "");
    }

    const adminReview = getAdminReview(answer.apiResponse);
    if (adminReview) {
      lines.push("#### Admin Review", "", codeBlock(adminReview, "json"), "");
    }

    if (answer.question.options.length > 0) {
      lines.push(
        "#### Question Options",
        "",
        "| label | text | is_correct | selected |",
        "| --- | --- | --- | --- |",
      );

      for (const option of answer.question.options) {
        lines.push(
          `| ${tableCell(option.label)} | ${tableCell(option.text)} | ${
            option.isCorrect
          } | ${option.id === answer.selectedOptionId} |`,
        );
      }
      lines.push("");
    }

    if (answer.question.apiConfig) {
      lines.push(
        "#### Question Config JSON",
        "",
        codeBlock(answer.question.apiConfig, "json"),
        "",
      );
    }

    lines.push(renderAnswerDetails(answer), "");
  });

  const filename = `assessment-${sanitizeFileName(attempt.internProfile.fullName) || attempt.id}.md`;

  return { content: lines.join("\n"), filename };
}
