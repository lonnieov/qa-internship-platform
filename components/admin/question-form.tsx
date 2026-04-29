"use client";

import { createQuestionAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type QuestionType = "QUIZ" | "API_SANDBOX" | "DEVTOOLS_SANDBOX";

export function QuestionForm({ initialType }: { initialType: QuestionType }) {
  const questionType = initialType;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый вопрос</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createQuestionAction} className="form-grid">
          <input type="hidden" name="questionType" value={questionType} />

          <div className="form-grid">
            <Label htmlFor="text">
              {questionType === "QUIZ" ? "Текст вопроса" : "Описание API-задачи"}
            </Label>
            <Textarea
              id="text"
              name="text"
              defaultValue={
                questionType === "QUIZ"
                  ? "Что проверяет smoke testing?"
                  : questionType === "API_SANDBOX"
                    ? "Отправьте запрос на создание пользователя Ali Valiyev и добейтесь ответа 201."
                    : "Нажмите кнопку, найдите request в Network и впишите значение поля message из response."
              }
              required
            />
          </div>

          {questionType === "QUIZ" ? (
            <div className="grid-2">
              {[0, 1, 2, 3].map((index) => (
                <div className="form-grid" key={index}>
                  <Label htmlFor={`option-${index}`}>
                    Вариант {String.fromCharCode(65 + index)}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`option-${index}`}
                      name={`option-${index}`}
                      defaultValue={
                        [
                          "Быстрая проверка критичного функционала после сборки",
                          "Полная проверка всех требований проекта",
                          "Проверка только визуального слоя интерфейса",
                          "Нагрузочное тестирование API",
                        ][index]
                      }
                      required
                    />
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
          ) : questionType === "API_SANDBOX" ? (
            <div className="stack">
              <div className="grid-2">
                <div className="form-grid">
                  <Label htmlFor="apiMethod">Ожидаемый method</Label>
                  <Select id="apiMethod" name="apiMethod" defaultValue="GET">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </Select>
                </div>
                <div className="form-grid">
                  <Label htmlFor="apiSuccessStatus">Успешный status code</Label>
                  <Input
                    id="apiSuccessStatus"
                    name="apiSuccessStatus"
                    type="number"
                    min="100"
                    max="599"
                    defaultValue="200"
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <Label htmlFor="apiPath">Ожидаемый path</Label>
                <Input id="apiPath" name="apiPath" defaultValue="/users" required />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiQuery">Ожидаемый query string</Label>
                <Input
                  id="apiQuery"
                  name="apiQuery"
                  defaultValue="status=active&limit=10"
                />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiHeaders">Обязательные request headers</Label>
                <Textarea
                  id="apiHeaders"
                  name="apiHeaders"
                  defaultValue={
                    "Authorization: Bearer test-token\nContent-Type: application/json"
                  }
                />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiBody">Ожидаемый JSON body</Label>
                <Textarea
                  id="apiBody"
                  name="apiBody"
                  defaultValue={'{\n  "name": "Ali Valiyev"\n}'}
                />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiSuccessBody">Успешный response body</Label>
                <Textarea
                  id="apiSuccessBody"
                  name="apiSuccessBody"
                  defaultValue={'{\n  "id": 101,\n  "name": "Ali Valiyev"\n}'}
                />
              </div>
            </div>
          ) : (
            <div className="stack">
              <div className="grid-2">
                <div className="form-grid">
                  <Label htmlFor="apiMethod">Method запроса в Network</Label>
                  <Select id="apiMethod" name="apiMethod" defaultValue="POST">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </Select>
                </div>
                <div className="form-grid">
                  <Label htmlFor="apiSuccessStatus">Status ответа</Label>
                  <Input
                    id="apiSuccessStatus"
                    name="apiSuccessStatus"
                    type="number"
                    min="100"
                    max="599"
                    defaultValue="200"
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <Label htmlFor="apiButtonLabel">Текст кнопки для стажёра</Label>
                <Input
                  id="apiButtonLabel"
                  name="apiButtonLabel"
                  defaultValue="Отправить запрос"
                  required
                />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiPath">Имя endpoint в Network</Label>
                <Input
                  id="apiPath"
                  name="apiPath"
                  defaultValue="/request_method"
                  required
                />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiQuery">Query string для endpoint</Label>
                <Input
                  id="apiQuery"
                  name="apiQuery"
                  defaultValue="step=1&source=button"
                />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiHeaders">Response headers</Label>
                <Textarea
                  id="apiHeaders"
                  name="apiHeaders"
                  defaultValue={"x-trace-id: qa-2026\ncontent-type: application/json"}
                />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiBody">Request JSON body, который уйдёт при клике</Label>
                <Textarea
                  id="apiBody"
                  name="apiBody"
                  defaultValue={'{\n  "action": "submit"\n}'}
                />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiSuccessBody">JSON response body для DevTools</Label>
                <Textarea
                  id="apiSuccessBody"
                  name="apiSuccessBody"
                  defaultValue={
                    '{\n  "message": "juniors never give up",\n  "hasBug": false\n}'
                  }
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-grid">
                  <Label htmlFor="apiAnswerPath">Путь параметра в response</Label>
                  <Input
                    id="apiAnswerPath"
                    name="apiAnswerPath"
                    defaultValue="message"
                    required
                  />
                </div>
                <div className="form-grid">
                  <Label htmlFor="apiExpectedAnswer">Ожидаемый ответ стажёра</Label>
                  <Input
                    id="apiExpectedAnswer"
                    name="apiExpectedAnswer"
                    defaultValue="juniors never give up"
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <Label htmlFor="apiAnswerLabel">Подпись поля ответа</Label>
                <Input
                  id="apiAnswerLabel"
                  name="apiAnswerLabel"
                  defaultValue="Введите значение поля message из response"
                />
              </div>
            </div>
          )}

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
