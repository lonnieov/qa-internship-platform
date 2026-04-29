"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseHeaderLines, parseQueryString } from "@/lib/api-sandbox";
import { requireAdmin } from "@/lib/auth";
import { generateInviteCode, hashInviteCode } from "@/lib/security";

export type InvitationState = {
  ok: boolean;
  message: string;
  inviteCode?: string;
};

export async function createInvitationAction(
  _prevState: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const admin = await requireAdmin();
  const candidateName = String(formData.get("candidateName") ?? "").trim();
  const expiresInDays = Number(formData.get("expiresInDays") ?? 14);

  if (!candidateName) {
    return { ok: false, message: "Укажите имя и фамилию кандидата." };
  }

  const inviteCode = generateInviteCode();
  const expiresAt = Number.isFinite(expiresInDays)
    ? new Date(Date.now() + Math.max(1, expiresInDays) * 24 * 60 * 60 * 1000)
    : null;

  await prisma.invitation.create({
    data: {
      candidateName,
      inviteCodeHash: hashInviteCode(inviteCode),
      expiresAt,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin/interns");

  return {
    ok: true,
    message: "Токен создан. Он показывается только сейчас.",
    inviteCode,
  };
}

export async function revokeInvitationAction(formData: FormData) {
  await requireAdmin();
  const invitationId = String(formData.get("invitationId") ?? "");

  if (!invitationId) return;

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "REVOKED" },
  });

  revalidatePath("/admin/interns");
}

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();
  const totalTimeMinutes = Number(formData.get("totalTimeMinutes") ?? 30);

  await prisma.assessmentSettings.upsert({
    where: { id: "global" },
    update: {
      totalTimeMinutes: Math.min(Math.max(Math.round(totalTimeMinutes), 1), 240),
      passingScore: 100,
    },
    create: {
      id: "global",
      totalTimeMinutes: Math.min(Math.max(Math.round(totalTimeMinutes), 1), 240),
      passingScore: 100,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

export async function createQuestionAction(formData: FormData) {
  const admin = await requireAdmin();
  const questionType = String(formData.get("questionType") ?? "QUIZ");
  const text = String(formData.get("text") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();

  const lastQuestion = await prisma.question.findFirst({
    orderBy: { order: "desc" },
  });

  if (questionType === "API_SANDBOX" || questionType === "DEVTOOLS_SANDBOX") {
    const method = String(formData.get("apiMethod") ?? "GET").trim().toUpperCase();
    const path = String(formData.get("apiPath") ?? "").trim();
    const query = String(formData.get("apiQuery") ?? "").trim();
    const headersText = String(formData.get("apiHeaders") ?? "").trim();
    const bodyText = String(formData.get("apiBody") ?? "").trim();
    const successStatus = Number(formData.get("apiSuccessStatus") ?? 200);
    const successBodyText = String(formData.get("apiSuccessBody") ?? "").trim();
    const answerPath = String(formData.get("apiAnswerPath") ?? "").trim();
    const expectedAnswer = String(formData.get("apiExpectedAnswer") ?? "").trim();

    if (!text || !path) {
      return;
    }

    if (
      questionType === "DEVTOOLS_SANDBOX" &&
      (!successBodyText || !answerPath || !expectedAnswer)
    ) {
      return;
    }

    let apiConfig;

    try {
      if (questionType === "API_SANDBOX") {
        apiConfig = {
          mode: "MANUAL_REQUEST",
          method,
          path,
          query: parseQueryString(query),
          headers: parseHeaderLines(headersText),
          body: bodyText ? JSON.parse(bodyText) : undefined,
          successStatus: Number.isFinite(successStatus) ? successStatus : 200,
          successBody: successBodyText ? JSON.parse(successBodyText) : { ok: true },
        };
      } else {
        apiConfig = {
          mode: "DEVTOOLS_RESPONSE",
          method,
          path,
          query: parseQueryString(query),
          successHeaders: parseHeaderLines(headersText),
          body: bodyText ? JSON.parse(bodyText) : undefined,
          successStatus: Number.isFinite(successStatus) ? successStatus : 200,
          successBody: successBodyText ? JSON.parse(successBodyText) : { ok: true },
          buttonLabel: String(formData.get("apiButtonLabel") ?? "Отправить запрос").trim(),
          answerLabel: String(formData.get("apiAnswerLabel") ?? "").trim(),
          answerPath,
          expectedAnswer,
        };
      }
    } catch {
      return;
    }

    await prisma.question.create({
      data: {
        type: questionType,
        text,
        explanation: explanation || null,
        order: (lastQuestion?.order ?? 0) + 1,
        createdById: admin.id,
        apiConfig,
      },
    });
  } else {
    const correctIndex = Number(formData.get("correctOption"));
    const options = [0, 1, 2, 3].map((index) =>
      String(formData.get(`option-${index}`) ?? "").trim(),
    );

    if (!text || options.some((option) => !option) || !Number.isInteger(correctIndex)) {
      return;
    }

    await prisma.question.create({
      data: {
        type: "QUIZ",
        text,
        explanation: explanation || null,
        order: (lastQuestion?.order ?? 0) + 1,
        createdById: admin.id,
        options: {
          create: options.map((option, index) => ({
            label: String.fromCharCode(65 + index),
            text: option,
            order: index,
            isCorrect: index === correctIndex,
          })),
        },
      },
    });
  }

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
}

export async function toggleQuestionAction(formData: FormData) {
  await requireAdmin();
  const questionId = String(formData.get("questionId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!questionId) return;

  await prisma.question.update({
    where: { id: questionId },
    data: { isActive: !isActive },
  });

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
}

export async function deleteQuestionAction(formData: FormData) {
  await requireAdmin();
  const questionId = String(formData.get("questionId") ?? "");

  if (!questionId) return;

  await prisma.question.delete({
    where: { id: questionId },
  });

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
}
