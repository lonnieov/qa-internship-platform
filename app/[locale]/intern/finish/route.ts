import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import {
  clearInternSession,
  createResultSession,
} from "@/lib/intern-token-auth";
import { isLocale } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function localeFromRequest(request: Request) {
  const locale = new URL(request.url).pathname.split("/")[1];
  return isLocale(locale) ? locale : "ru";
}

export async function GET(request: Request) {
  const locale = localeFromRequest(request);
  const profile = await getCurrentProfile();
  const attemptId = new URL(request.url).searchParams.get("attempt");

  if (
    !profile ||
    profile.role !== "INTERN" ||
    !profile.internProfile ||
    !attemptId
  ) {
    redirect(`/${locale}/sign-in/intern`);
  }

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: attemptId,
      internProfileId: profile.internProfile.id,
      status: { not: "IN_PROGRESS" },
    },
  });

  if (!attempt) {
    redirect(`/${locale}/intern`);
  }

  if (profile.internProfile.invitationId) {
    await prisma.invitation.update({
      where: { id: profile.internProfile.invitationId },
      data: { status: "COMPLETED" },
    });
  }

  const ticket = await createResultSession(attempt.id);
  await clearInternSession();
  redirect(`/${locale}/intern/result?ticket=${encodeURIComponent(ticket)}`);
}
