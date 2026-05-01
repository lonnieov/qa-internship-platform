import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { generateAttemptReportMarkdown } from "@/lib/attempt-report-md";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  await requireAdmin();

  const { attemptId } = await params;
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
