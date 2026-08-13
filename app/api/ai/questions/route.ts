import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getAIClient, getAIModel } from "@/lib/ai-client";
import {
  ResumeFileTooLargeError,
  UnsupportedResumeFileError,
  extractResumeText,
} from "@/lib/resume-extract";

export const runtime = "nodejs";

const MAX_VACANCY_LENGTH = 6000;

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

  const formData = await request.formData();
  const topic = String(formData.get("topic") ?? "QA теория для стажёров").slice(
    0,
    500,
  );
  const vacancy = String(formData.get("vacancy") ?? "").slice(
    0,
    MAX_VACANCY_LENGTH,
  );
  const cvFile = formData.get("cv");

  let cvText = "";
  if (cvFile instanceof File && cvFile.size > 0) {
    try {
      cvText = await extractResumeText(cvFile);
    } catch (error) {
      if (error instanceof ResumeFileTooLargeError) {
        return NextResponse.json(
          { error: "Файл резюме слишком большой (максимум 5 МБ)." },
          { status: 400 },
        );
      }
      if (error instanceof UnsupportedResumeFileError) {
        return NextResponse.json(
          { error: "Резюме поддерживается только в формате PDF или DOCX." },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Не удалось прочитать файл резюме." },
        { status: 400 },
      );
    }
  }

  const contextSections = [
    vacancy ? `Описание вакансии:\n${vacancy}` : "",
    cvText ? `Резюме кандидата:\n${cvText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const userPrompt = `Сгенерируй вопросы для ассессмента QA-кандидата по следующей инструкции: ${topic}.
${
  contextSections
    ? `\n${contextSections}\n\nОриентируйся в первую очередь на конкретный опыт, технологии и требования из вакансии/резюме выше, а не только на общую тему — вопросы должны проверять именно то, что релевантно этому кандидату и этой вакансии.\n`
    : ""
}
Строго соблюдай запрошенное количество вопросов и соотношение открытых/закрытых, если оно указано. Если инструкция не задаёт количество или тип, сгенерируй 3 простых однозначных вопроса закрытого типа.

Верни только JSON без markdown:
{"questions":[
  {"type":"closed","text":"...","options":["...","...","...","..."],"correctIndex":0},
  {"type":"open","text":"...","answer":"..."}
]}
Правила:
- "type" — "closed" (вопрос с вариантами ответа) или "open" (вопрос со свободным ответом).
- Для "closed": ровно 4 варианта в "options" и один правильный индекс 0-3 в "correctIndex".
- Для "open": не добавляй "options" и "correctIndex" — вместо них короткий эталонный ответ в поле "answer".`;

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
        content: userPrompt,
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
