import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { getResultAttemptId, verifyResultTicket } from "@/lib/intern-token-auth";
import { prisma } from "@/lib/prisma";

export default async function InternResultPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { ticket } = await searchParams;
  const attemptId = verifyResultTicket(ticket) ?? (await getResultAttemptId());

  if (!attemptId) {
    redirect("/sign-in/intern");
  }

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      internProfile: true,
    },
  });

  if (!attempt || attempt.status === "IN_PROGRESS") {
    redirect("/sign-in/intern");
  }

  return (
    <main className="page page-narrow stack-lg">
      <div
        className="stack"
        style={{ justifyItems: "center", textAlign: "center", paddingTop: 48 }}
      >
        <h1 className="head-1">Спасибо за участие!</h1>
        <p className="body-1 muted m-0">{attempt.internProfile.fullName}</p>
      </div>

      <div className="soft-panel nav-row">
        <LockKeyhole size={18} color="var(--destructive)" />
        <strong>Доступ по токену аннулирован.</strong>
        <span className="body-2 muted">
          Повторный вход и повторная попытка недоступны.
        </span>
      </div>

      <div style={{ height: 1 }} />
    </main>
  );
}
