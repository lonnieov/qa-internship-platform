import { deleteQuestionAction, toggleQuestionAction } from "@/actions/admin";
import { prisma } from "@/lib/prisma";
import { AiQuestionGenerator } from "@/components/admin/ai-question-generator";
import { QuestionForm } from "@/components/admin/question-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminQuestionsPage() {
  const questions = await prisma.question.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { options: { orderBy: { order: "asc" } } },
  });

  return (
    <main className="page stack-lg">
      <div className="page-header">
        <div>
          <h1 className="head-1">Банк вопросов</h1>
          <p className="body-1 muted m-0">
            Каждый вопрос закрытого типа: четыре варианта и один правильный.
          </p>
        </div>
      </div>

      <section className="grid-2">
        <QuestionForm />
        <AiQuestionGenerator />
      </section>

      <section className="stack">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="metric">
                <div>
                  <CardTitle>
                    {index + 1}. {question.text}
                  </CardTitle>
                  {question.explanation ? (
                    <p className="body-2 muted m-0">{question.explanation}</p>
                  ) : null}
                </div>
                <Badge variant={question.isActive ? "success" : "muted"}>
                  {question.isActive ? "активен" : "скрыт"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="stack">
              <div className="grid-2">
                {question.options.map((option) => (
                  <div
                    className="soft-panel"
                    key={option.id}
                    style={{
                      border: option.isCorrect ? "1px solid var(--accent)" : undefined,
                    }}
                  >
                    <strong>{option.label}.</strong> {option.text}
                  </div>
                ))}
              </div>
              <div className="nav-row">
                <form action={toggleQuestionAction}>
                  <input type="hidden" name="questionId" value={question.id} />
                  <input
                    type="hidden"
                    name="isActive"
                    value={String(question.isActive)}
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    {question.isActive ? "Скрыть" : "Активировать"}
                  </Button>
                </form>
                <form action={deleteQuestionAction}>
                  <input type="hidden" name="questionId" value={question.id} />
                  <Button type="submit" variant="outline" size="sm">
                    Архивировать
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
        {questions.length === 0 ? (
          <Card>
            <CardContent className="p-6 muted">Пока нет вопросов.</CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
