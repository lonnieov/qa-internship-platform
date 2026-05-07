import { notFound } from "next/navigation";
import { getManageableTrackIds, requireAdminAccess } from "@/lib/auth";
import { generateAttemptReportMarkdown } from "@/lib/attempt-report-md";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const profile = await requireAdminAccess();

  const { attemptId } = await params;
  const manageableTrackIds = await getManageableTrackIds(profile);
  if (manageableTrackIds) {
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      select: { trackId: true },
    });
    if (!attempt?.trackId || !manageableTrackIds.includes(attempt.trackId)) {
      notFound();
    }
  }
  const report = await generateAttemptReportMarkdown(attemptId);

  if (!report) notFound();

  const encodedFilename = encodeURIComponent(report.filename);

  return new Response(report.content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="assessment-report.md"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "no-store",
    },
  });
}
