import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { stringifyPrettyJson } from "@/lib/api-sandbox";
import { getOpenQuizConfig } from "@/lib/open-quiz";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatPercent } from "@/lib/utils";

const fontPath = path.join(
  process.cwd(),
  "public",
  "fonts",
  "NotoSans-Regular.ttf",
);

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";

  return value.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Zа-яА-Я0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getAnswerText(
  answer: NonNullable<
    Awaited<ReturnType<typeof getAttemptReportData>>
  >["answers"][number],
) {
  if (
    answer.question.type === "API_SANDBOX" ||
    answer.question.type === "DEVTOOLS_SANDBOX"
  ) {
    const response =
      answer.apiResponse && typeof answer.apiResponse === "object"
        ? (answer.apiResponse as { status?: number })
        : null;
    const request = answer.apiRequest
      ? `\nRequest:\n${stringifyPrettyJson(answer.apiRequest)}`
      : "";

    return `API request, status ${response?.status ?? "-"}, отправок: ${
      answer.submissionCount
    }${request}`;
  }

  if (getOpenQuizConfig(answer.question.apiConfig)) {
    return (
      (
        answer.apiRequest as
          | {
              answerText?: string;
            }
          | null
          | undefined
      )?.answerText ?? "не заполнен"
    );
  }

  return answer.selectedOption?.text ?? "не выбран";
}

function addFooter(doc: PDFKit.PDFDocument) {
  const bottom = doc.page.height - 36;
  doc
    .fontSize(8)
    .fillColor("#6b7280")
    .text("Coin Assessment", 48, bottom, { continued: true })
    .text(formatDateTime(new Date()), { align: "right" });
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom - 24) {
    addFooter(doc);
    doc.addPage();
    doc.font("NotoSans");
  }
}

function addMetric(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  doc
    .roundedRect(x, y, width, 72, 8)
    .fillAndStroke("#f8fafc", "#e5e7eb")
    .fillColor("#64748b")
    .fontSize(9)
    .text(label, x + 14, y + 14, { width: width - 28 })
    .fillColor("#111827")
    .fontSize(18)
    .text(value, x + 14, y + 36, { width: width - 28 });
}

async function getAttemptReportData(attemptId: string) {
  return prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      internProfile: { include: { profile: true } },
      answers: {
        include: {
          question: { include: { options: { orderBy: { order: "asc" } } } },
          selectedOption: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function generateAttemptReportPdf(attemptId: string) {
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

  const buffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      autoFirstPage: false,
      bufferPages: true,
      info: {
        Title: "Отчёт по ассессменту",
        Author: "Coin Assessment",
      },
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (!fs.existsSync(fontPath)) {
      reject(new Error(`PDF font file is missing: ${fontPath}`));
      return;
    }

    doc.registerFont("NotoSans", fs.readFileSync(fontPath));
    doc.addPage();
    doc.font("NotoSans");

    doc
      .fillColor("#111827")
      .fontSize(22)
      .text("Отчёт по ассессменту")
      .moveDown(0.35)
      .fillColor("#64748b")
      .fontSize(10)
      .text(`${attempt.internProfile.fullName} · вход по токену без email`)
      .text(
        `Начало: ${formatDateTime(attempt.startedAt)} · Завершение: ${formatDateTime(
          attempt.submittedAt,
        )}`,
      )
      .moveDown(1.4);

    const metricTop = doc.y;
    const metricWidth = 150;
    addMetric(
      doc,
      "Итоговый результат",
      formatPercent(score),
      48,
      metricTop,
      metricWidth,
    );
    addMetric(
      doc,
      "Общее время",
      formatDuration(totalTimeMs),
      48 + metricWidth + 14,
      metricTop,
      metricWidth,
    );
    addMetric(
      doc,
      "Среднее на вопрос",
      formatDuration(averageQuestionTimeMs),
      48 + (metricWidth + 14) * 2,
      metricTop,
      metricWidth,
    );
    doc.y = metricTop + 96;

    doc
      .fillColor("#111827")
      .fontSize(14)
      .text("Итог")
      .moveDown(0.4)
      .fillColor("#374151")
      .fontSize(10)
      .text(`Статус: ${attempt.status}`)
      .text(`Верные ответы: ${attempt.correctCount}/${attempt.questionCount}`)
      .moveDown(1);

    doc
      .fillColor("#111827")
      .fontSize(14)
      .text("Время по вопросам")
      .moveDown(0.4);

    attempt.answers.forEach((answer, index) => {
      const isOpenQuiz = Boolean(getOpenQuizConfig(answer.question.apiConfig));
      const resultText = isOpenQuiz
        ? "без оценки"
        : answer.isCorrect
          ? "верно"
          : "0 баллов";
      const answerText = getAnswerText(answer);
      const top = doc.y;
      const estimatedHeight =
        74 + Math.min(160, Math.ceil(answerText.length / 90) * 14);

      ensureSpace(doc, estimatedHeight);

      doc
        .roundedRect(48, doc.y, doc.page.width - 96, estimatedHeight, 8)
        .fillAndStroke("#ffffff", "#e5e7eb");
      doc.y += 14;
      doc
        .fillColor("#111827")
        .fontSize(11)
        .text(`${index + 1}. ${answer.question.text}`, 62, doc.y, {
          width: doc.page.width - 124,
        })
        .moveDown(0.35)
        .fillColor("#64748b")
        .fontSize(9)
        .text(
          `Время: ${formatDuration(answer.timeSpentMs)} · Результат: ${resultText}`,
          {
            width: doc.page.width - 124,
          },
        )
        .moveDown(0.35)
        .fillColor("#374151")
        .fontSize(9)
        .text(`Ответ: ${answerText.slice(0, 900)}`, {
          width: doc.page.width - 124,
        });

      doc.y = Math.max(doc.y + 14, top + estimatedHeight + 10);
    });

    addFooter(doc);
    doc.end();
  });

  const filename = `assessment-${sanitizeFileName(attempt.internProfile.fullName) || attempt.id}.pdf`;

  return { buffer, filename };
}
