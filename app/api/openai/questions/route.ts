import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCurrentProfile } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY не задан. AI-подсказки отключены." },
      { status: 503 },
    );
  }

  const body = await request.json();
  const topic = String(body.topic ?? "QA теория для стажёров").slice(0, 200);
  const client = new OpenAI();

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5",
    input: `Сгенерируй 3 простых однозначных вопроса закрытого типа для ассессмента QA стажёров по теме: ${topic}.
Верни только JSON без markdown:
{"questions":[{"text":"...","options":["...","...","...","..."],"correctIndex":0}]}
У каждого вопроса должно быть ровно 4 варианта и один правильный индекс 0-3.`,
  });

  try {
    const parsed = JSON.parse(response.output_text);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "OpenAI вернул невалидный JSON.", raw: response.output_text },
      { status: 502 },
    );
  }
}
