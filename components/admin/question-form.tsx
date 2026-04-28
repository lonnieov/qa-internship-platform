import { createQuestionAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function QuestionForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый вопрос</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createQuestionAction} className="form-grid">
          <div className="form-grid">
            <Label htmlFor="text">Текст вопроса</Label>
            <Textarea
              id="text"
              name="text"
              placeholder="Что проверяет smoke testing?"
              required
            />
          </div>
          <div className="grid-2">
            {[0, 1, 2, 3].map((index) => (
              <div className="form-grid" key={index}>
                <Label htmlFor={`option-${index}`}>
                  Вариант {String.fromCharCode(65 + index)}
                </Label>
                <div className="flex gap-2">
                  <Input id={`option-${index}`} name={`option-${index}`} required />
                  <label className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--muted)] px-3 text-[12.5px] font-semibold">
                    <input
                      name="correctOption"
                      type="radio"
                      value={index}
                      defaultChecked={index === 0}
                    />
                    верный
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="form-grid">
            <Label htmlFor="explanation">Пояснение для админа</Label>
            <Textarea id="explanation" name="explanation" />
          </div>
          <Button type="submit">Добавить вопрос</Button>
        </form>
      </CardContent>
    </Card>
  );
}
