import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getAIClient, getAIModel } from "@/lib/ai-client";

export const runtime = "nodejs";

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response does not contain JSON.");
    return JSON.parse(match[0]);
  }
}

export async function POST(request: Request) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = getAIClient();
  if (!client) {
    return NextResponse.json(
      {
        error:
          "AI-прокси не настроен. Задайте CLI_PROXY_API_URL и CLI_PROXY_API_KEY.",
      },
      { status: 503 },
    );
  }

  const body = await request.json();
  const topic = String(body.topic ?? "QA теория для стажёров").slice(0, 200);

  const response = await client.chat.completions.create({
    model: getAIModel(),
    messages: [
      {
        role: "system",
        content:
          "Ты помогаешь администратору подготовить вопросы для QA assessment. Отвечай только валидным JSON без markdown.",
      },
      {
        role: "user",
        content: `Сгенерируй 3 простых однозначных вопроса закрытого типа для ассессмента QA стажёров по теме: ${topic}.
Верни только JSON без markdown:
{"questions":[{"text":"...","options":["...","...","...","..."],"correctIndex":0}]}
У каждого вопроса должно быть ровно 4 варианта и один правильный индекс 0-3.`,
      },
    ],
  });

  const outputText = response.choices[0]?.message.content;
  if (!outputText) {
    return NextResponse.json(
      { error: "AI-прокси вернул пустой ответ." },
      { status: 502 },
    );
  }

  try {
    const parsed = parseJsonObject(outputText);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      {
        error: "AI-прокси вернул невалидный JSON.",
        raw: outputText,
      },
      { status: 502 },
    );
  }
}
