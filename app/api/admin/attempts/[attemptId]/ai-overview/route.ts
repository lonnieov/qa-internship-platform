import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { generateGroqAttemptOverview } from "@/lib/groq-overview";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { attemptId } = await params;

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY не задан. AI overview отключён." },
      { status: 503 },
    );
  }

  try {
    const overview = await generateGroqAttemptOverview(attemptId);

    if (!overview) {
      return NextResponse.json(
        { error: "Попытка не найдена." },
        { status: 404 },
      );
    }

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Groq overview failed", error);
    return NextResponse.json(
      { error: "Не удалось получить AI overview от Groq." },
      { status: 502 },
    );
  }
}
