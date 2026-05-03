import { generateAttemptReportMarkdown } from "@/lib/attempt-report-md";
import { getGroqClient, getGroqModel } from "@/lib/groq-client";

export type GroqOverviewResult = {
  overview: string;
  model: string;
  generatedAt: string;
};

const groqSystemPrompt = `Ты senior QA lead и интервьюер стажёров.
Тебе передают Markdown-отчёт ассессмента кандидата.
Сделай краткую, но содержательную сводку строго по данным отчёта.
Не выдумывай факты, не ставь диагнозы и не делай выводы вне предоставленных данных.
Пиши по-русски.

Структура ответа:
1. Итоговая оценка кандидата
2. Сильные стороны
3. Слабые места и риски
4. Разбор по типам заданий
5. Временной профиль прохождения
6. Рекомендация для следующего шага
7. Вопросы для follow-up интервью`;

export async function generateGroqAttemptOverview(
  attemptId: string,
): Promise<GroqOverviewResult | null> {
  const report = await generateAttemptReportMarkdown(attemptId);
  if (!report) return null;

  const model = getGroqModel();
  const client = getGroqClient();
  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: groqSystemPrompt,
      },
      {
        role: "user",
        content: `Проанализируй этот assessment report и верни полный overview для администратора:\n\n${report.content}`,
      },
    ],
    temperature: 0.2,
    max_completion_tokens: 1800,
    stream: false,
  });

  return {
    overview:
      completion.choices[0]?.message.content?.trim() ||
      "Groq не вернул текст отчёта.",
    model,
    generatedAt: new Date().toISOString(),
  };
}
