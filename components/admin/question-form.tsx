"use client";

import { useState } from "react";
import { createQuestionAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function QuestionForm() {
  const [questionType, setQuestionType] = useState("QUIZ");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый вопрос</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createQuestionAction} className="form-grid">
          <input type="hidden" name="questionType" value={questionType} />

          <div className="form-grid">
            <Label htmlFor="questionType">Тип вопроса</Label>
            <Select
              id="questionType"
              value={questionType}
              onChange={(event) => setQuestionType(event.target.value)}
            >
              <option value="QUIZ">Quiz</option>
              <option value="API_SANDBOX">API Sandbox</option>
            </Select>
          </div>

          <div className="form-grid">
            <Label htmlFor="text">
              {questionType === "QUIZ" ? "Текст вопроса" : "Описание API-задачи"}
            </Label>
            <Textarea
              id="text"
              name="text"
              placeholder={
                questionType === "QUIZ"
                  ? "Что проверяет smoke testing?"
                  : "Отправьте запрос на создание пользователя Ali Valiyev и добейтесь ответа 201."
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
          ) : (
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
                <Input id="apiPath" name="apiPath" placeholder="/users" required />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiQuery">Ожидаемый query string</Label>
                <Input
                  id="apiQuery"
                  name="apiQuery"
                  placeholder="status=active&limit=10"
                />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiHeaders">Обязательные headers</Label>
                <Textarea
                  id="apiHeaders"
                  name="apiHeaders"
                  placeholder={"Authorization: Bearer test-token\nContent-Type: application/json"}
                />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiBody">Ожидаемый JSON body</Label>
                <Textarea
                  id="apiBody"
                  name="apiBody"
                  placeholder={'{\n  "name": "Ali Valiyev"\n}'}
                />
              </div>

              <div className="form-grid">
                <Label htmlFor="apiSuccessBody">Успешный response body</Label>
                <Textarea
                  id="apiSuccessBody"
                  name="apiSuccessBody"
                  placeholder={'{\n  "id": 101,\n  "name": "Ali Valiyev"\n}'}
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
