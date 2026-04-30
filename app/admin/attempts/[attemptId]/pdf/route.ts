import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { generateAttemptReportPdf } from "@/lib/attempt-report-pdf";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  await requireAdmin();

  const { attemptId } = await params;
  const report = await generateAttemptReportPdf(attemptId);

  if (!report) notFound();

  const encodedFilename = encodeURIComponent(report.filename);

  return new Response(new Uint8Array(report.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="assessment-report.pdf"; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "no-store",
    },
  });
}
