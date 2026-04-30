"use client";

import { useState } from "react";
import { createQuestionAction, updateQuestionAction } from "@/actions/admin";
import { JsonEditor } from "@/components/admin/json-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getQuestionTrackMeta,
  getTrackDisplayName,
  type TrackSummary,
} from "@/lib/question-classification";
import { getOpenQuizConfig } from "@/lib/open-quiz";
import {
  clickSuperAppClickAvtoPresetConfig,
  getManualQaSandboxConfig,
  manualQaPresetOptions,
} from "@/lib/manual-qa-sandbox";

type QuestionType =
  | "QUIZ"
  | "API_SANDBOX"
  | "DEVTOOLS_SANDBOX"
  | "MANUAL_QA_SANDBOX";
type JsonRecord = Record<string, unknown>;
type EditableQuestion = {
  id: string;
  type: QuestionType;
  track: string;
  trackId: string | null;
  trackRef: { id: string; slug: string; name: string } | null;
  text: string;
  explanation: string | null;
  apiConfig: unknown;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(config: JsonRecord, key: string, fallback = "") {
  const value = config[key];
  return typeof value === "string" ? value : fallback;
}

function readNumber(config: JsonRecord, key: string, fallback: number) {
  const value = config[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringifyJson(value: unknown, fallback: string) {
  if (typeof value === "undefined" || value === null) return fallback;
  return JSON.stringify(value, null, 2);
}

function queryToText(value: unknown) {
  if (!isRecord(value)) return "";
  return new URLSearchParams(
    Object.entries(value).map(([key, entry]) => [key, String(entry)]),
  ).toString();
}

function headersToText(value: unknown) {
  if (!isRecord(value)) return "";
  return Object.entries(value)
    .map(([key, entry]) => `${key}: ${String(entry)}`)
    .join("\n");
}

function getConfig(question: EditableQuestion | undefined) {
  return isRecord(question?.apiConfig) ? question.apiConfig : {};
}

export function QuestionForm({
  initialType,
  initialTrackId,
  tracks,
  embedded = false,
  lockType = false,
  showTitle = true,
  question,
}: {
  initialType: QuestionType;
  initialTrackId?: string;
  tracks: TrackSummary[];
  embedded?: boolean;
  lockType?: boolean;
  showTitle?: boolean;
  question?: EditableQuestion;
}) {
  const [draftType, setDraftType] = useState<QuestionType>(
    question?.type ?? initialType,
  );
  const [draftQuizMode, setDraftQuizMode] = useState<"CHOICE" | "OPEN_TEXT">(
    getOpenQuizConfig(question?.apiConfig) ? "OPEN_TEXT" : "CHOICE",
  );
  const activeTracks = tracks.filter((track) => track.isActive !== false);
  const selectableTracks = question?.trackRef
    ? [
        question.trackRef,
        ...activeTracks.filter((track) => track.id !== question.trackRef?.id),
      ]
    : activeTracks;
  const fallbackTrack = selectableTracks[0] ?? tracks[0];
  const [draftTrackId, setDraftTrackId] = useState(
    question?.trackRef?.id ?? initialTrackId ?? fallbackTrack?.id ?? "",
  );
  const draftTrack =
    tracks.find((track) => track.id === draftTrackId) ?? fallbackTrack;
  const questionType = question?.type ?? draftType;
  const openQuizConfig = getOpenQuizConfig(question?.apiConfig);
  const quizMode = questionType === "QUIZ" ? draftQuizMode : "CHOICE";
  const config = getConfig(question);
  const manualQaConfig =
    getManualQaSandboxConfig(question?.apiConfig) ??
    clickSuperAppClickAvtoPresetConfig;
  const isEditing = Boolean(question);
  const sortedOptions = [...(question?.options ?? [])].sort(
    (left, right) => left.order - right.order,
  );

  const title = isEditing ? "Редактировать вопрос" : "Новый вопрос";
  const action = isEditing ? updateQuestionAction : createQuestionAction;
  const submitLabel = isEditing ? "Сохранить изменения" : "Добавить вопрос";
  const form = (
    <form action={action} className="form-grid">
      {question ? (
        <input type="hidden" name="questionId" value={question.id} />
      ) : null}
      <input type="hidden" name="questionType" value={questionType} />
      <input type="hidden" name="quizMode" value={quizMode} />
      <input type="hidden" name="trackId" value={draftTrackId} />
      <input
        type="hidden"
        name="track"
        value={
          draftTrack?.name ??
          (question ? getTrackDisplayName(question) : "QA")
        }
      />

      {!isEditing && !lockType ? (
        <div className="form-grid">
          <Label>Тип вопроса</Label>
          <div className="question-form-choice-grid">
            {[
              ["QUIZ", "Quiz"],
              ["API_SANDBOX", "API Sandbox"],
              ["DEVTOOLS_SANDBOX", "DevTools"],
              ["MANUAL_QA_SANDBOX", "Manual QA"],
            ].map(([value, label]) => (
              <label className="question-form-choice" key={value}>
                <input
                  checked={questionType === value}
                  name="questionTypeChoice"
                  onChange={() => setDraftType(value as QuestionType)}
                  type="radio"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="form-grid">
          <Label>Тип вопроса</Label>
          <span className="type-chip">
            {questionType === "DEVTOOLS_SANDBOX"
              ? "DevTools"
              : questionType === "API_SANDBOX"
                ? "API Sandbox"
                : questionType === "MANUAL_QA_SANDBOX"
                  ? "Manual QA"
                  : "Quiz"}
          </span>
        </div>
      )}

      <div className="form-grid">
        <Label>Классификация</Label>
        <div className="question-form-choice-grid">
          {selectableTracks.map((track) => {
            const meta = getQuestionTrackMeta(track);
            return (
              <label className="question-form-choice" key={track.id ?? track.slug}>
                <input
                  checked={draftTrackId === track.id}
                  name="trackChoice"
                  onChange={() => setDraftTrackId(track.id ?? "")}
                  type="radio"
                  disabled={!track.id}
                />
                <span className={meta.dotClassName} />
                {meta.label}
              </label>
            );
          })}
        </div>
        {selectableTracks.length === 0 ? (
          <p className="body-2 muted m-0">
            Создайте активный трек перед добавлением вопроса.
          </p>
        ) : null}
      </div>

      <div className="form-grid">
        <Label htmlFor="text">
          {questionType === "QUIZ"
            ? "Текст вопроса"
            : questionType === "MANUAL_QA_SANDBOX"
              ? "Миссия для стажёра"
              : "Описание API-задачи"}
        </Label>
        <Textarea
          id="text"
          key={questionType}
          name="text"
          defaultValue={
            question?.text ??
            (questionType === "QUIZ"
              ? "Что проверяет smoke testing?"
              : questionType === "API_SANDBOX"
                ? "Отправьте запрос на создание пользователя Ali Valiyev и добейтесь ответа 201."
                : questionType === "MANUAL_QA_SANDBOX"
                  ? clickSuperAppClickAvtoPresetConfig.mission
                  : "Нажмите кнопку, найдите request в Network и впишите значение поля message из response.")
          }
          required
        />
      </div>

      {questionType === "QUIZ" ? (
        <div className="stack">
          {!isEditing ? (
            <div className="form-grid">
              <Label>Формат Quiz-вопроса</Label>
              <div className="question-form-choice-grid">
                {[
                  ["CHOICE", "С вариантами"],
                  ["OPEN_TEXT", "Открытый ответ"],
                ].map(([value, label]) => (
                  <label className="question-form-choice" key={value}>
                    <input
                      checked={quizMode === value}
                      name="quizModeChoice"
                      onChange={() =>
                        setDraftQuizMode(value as "CHOICE" | "OPEN_TEXT")
                      }
                      type="radio"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="form-grid">
              <Label>Формат Quiz-вопроса</Label>
              <div className="question-form-choice-grid">
                {[
                  ["CHOICE", "С вариантами"],
                  ["OPEN_TEXT", "Открытый ответ"],
                ].map(([value, label]) => (
                  <label className="question-form-choice" key={value}>
                    <input
                      checked={quizMode === value}
                      name="quizModeChoice"
                      onChange={() =>
                        setDraftQuizMode(value as "CHOICE" | "OPEN_TEXT")
                      }
                      type="radio"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {quizMode === "OPEN_TEXT" ? (
            <div className="stack">
              <div className="form-grid">
                <Label htmlFor="openExpectedAnswer">Эталонный ответ</Label>
                <Textarea
                  id="openExpectedAnswer"
                  name="openExpectedAnswer"
                  defaultValue={openQuizConfig?.expectedAnswer ?? ""}
                  placeholder="Необязательно. Можно оставить подсказку для проверяющего."
                />
              </div>
              <div className="grid-2">
                <div className="form-grid">
                  <Label htmlFor="openAnswerLabel">
                    Подпись поля для стажёра
                  </Label>
                  <Input
                    id="openAnswerLabel"
                    name="openAnswerLabel"
                    defaultValue={openQuizConfig?.answerLabel ?? ""}
                    placeholder="Опишите ответ своими словами"
                  />
                </div>
                <div className="form-grid">
                  <Label htmlFor="openPlaceholder">Placeholder</Label>
                  <Input
                    id="openPlaceholder"
                    name="openPlaceholder"
                    defaultValue={openQuizConfig?.placeholder ?? ""}
                    placeholder="Введите ответ"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid-2">
              {[0, 1, 2, 3].map((index) => {
                const option = sortedOptions[index];

                return (
                  <div className="form-grid" key={option?.id ?? index}>
                    {option ? (
                      <input
                        type="hidden"
                        name={`optionId-${index}`}
                        value={option.id}
                      />
                    ) : null}
                    <Label htmlFor={`option-${index}`}>
                      Вариант {String.fromCharCode(65 + index)}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`option-${index}`}
                        name={`option-${index}`}
                        defaultValue={
                          option?.text ??
                          [
                            "Быстрая проверка критичного функционала после сборки",
                            "Полная проверка всех требований проекта",
                            "Проверка только визуального слоя интерфейса",
                            "Нагрузочное тестирование API",
                          ][index]
                        }
                        required={quizMode === "CHOICE"}
                      />
                      <label className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--muted)] px-3 text-[12.5px] font-semibold">
                        <input
                          name="correctOption"
                          type="radio"
                          value={index}
                          defaultChecked={option?.isCorrect ?? index === 0}
                        />
                        верный
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : questionType === "API_SANDBOX" ? (
        <div className="stack">
          <div className="grid-2">
            <div className="form-grid">
              <Label htmlFor="apiMethod">Ожидаемый method</Label>
              <Select
                id="apiMethod"
                name="apiMethod"
                defaultValue={readString(config, "method", "GET")}
              >
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
                defaultValue={readNumber(config, "successStatus", 200)}
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <Label htmlFor="apiPath">Ожидаемый path</Label>
            <Input
              id="apiPath"
              name="apiPath"
              defaultValue={readString(config, "path", "/users")}
              required
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiQuery">Ожидаемый query string</Label>
            <Input
              id="apiQuery"
              name="apiQuery"
              defaultValue={
                queryToText(config.query) || "status=active&limit=10"
              }
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiHeaders">Обязательные request headers</Label>
            <Textarea
              id="apiHeaders"
              name="apiHeaders"
              defaultValue={
                headersToText(config.headers) ||
                "Authorization: Bearer test-token\nContent-Type: application/json"
              }
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiBody">Ожидаемый JSON body</Label>
            <JsonEditor
              id="apiBody"
              name="apiBody"
              defaultValue={stringifyJson(
                config.body,
                '{\n  "name": "Ali Valiyev"\n}',
              )}
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiSuccessBody">Успешный response body</Label>
            <JsonEditor
              id="apiSuccessBody"
              name="apiSuccessBody"
              defaultValue={stringifyJson(
                config.successBody,
                '{\n  "id": 101,\n  "name": "Ali Valiyev"\n}',
              )}
            />
          </div>
        </div>
      ) : questionType === "MANUAL_QA_SANDBOX" ? (
        <div className="stack">
          <div className="form-grid">
            <Label htmlFor="manualQaPreset">Preset приложения</Label>
            <Select
              id="manualQaPreset"
              name="manualQaPreset"
              defaultValue={manualQaConfig.appPreset}
            >
              {manualQaPresetOptions.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="form-grid">
            <Label htmlFor="manualQaScenarioTitle">Название сценария</Label>
            <Input
              id="manualQaScenarioTitle"
              name="manualQaScenarioTitle"
              defaultValue={manualQaConfig.scenarioTitle}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-grid">
              <Label htmlFor="manualQaViewportWidth">Viewport width</Label>
              <Input
                id="manualQaViewportWidth"
                name="manualQaViewportWidth"
                type="number"
                min="320"
                max="520"
                defaultValue={manualQaConfig.viewport.width}
                required
              />
            </div>
            <div className="form-grid">
              <Label htmlFor="manualQaViewportHeight">Viewport height</Label>
              <Input
                id="manualQaViewportHeight"
                name="manualQaViewportHeight"
                type="number"
                min="568"
                max="980"
                defaultValue={manualQaConfig.viewport.height}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-grid">
              <Label htmlFor="manualQaTimeHintMinutes">Рекоменд. минуты</Label>
              <Input
                id="manualQaTimeHintMinutes"
                name="manualQaTimeHintMinutes"
                type="number"
                min="1"
                max="60"
                defaultValue={manualQaConfig.timeHintMinutes}
                required
              />
            </div>
            <div className="form-grid">
              <Label htmlFor="manualQaCategories">
                Категории через запятую
              </Label>
              <Input
                id="manualQaCategories"
                name="manualQaCategories"
                defaultValue={manualQaConfig.bugCategories.join(", ")}
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <Label htmlFor="manualQaKnownBugs">Known bugs rubric</Label>
            <JsonEditor
              id="manualQaKnownBugs"
              name="manualQaKnownBugs"
              defaultValue={stringifyJson(
                manualQaConfig.knownBugs,
                stringifyJson(
                  clickSuperAppClickAvtoPresetConfig.knownBugs,
                  "[]",
                ),
              )}
            />
          </div>

          <div className="soft-panel stack">
            <strong>Этот тип требует ручной проверки</strong>
            <p className="body-2 muted m-0">
              Стажёр будет искать баги в miniapp и оформлять баг-репорты.
              Known bugs нужны для рубрики проверяющего и будущей
              полуавтоматической оценки.
            </p>
          </div>
        </div>
      ) : (
        <div className="stack">
          <div className="grid-2">
            <div className="form-grid">
              <Label htmlFor="apiMethod">Method запроса в Network</Label>
              <Select
                id="apiMethod"
                name="apiMethod"
                defaultValue={readString(config, "method", "POST")}
              >
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
                defaultValue={readNumber(config, "successStatus", 200)}
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <Label htmlFor="apiButtonLabel">Текст кнопки для стажёра</Label>
            <Input
              id="apiButtonLabel"
              name="apiButtonLabel"
              defaultValue={readString(
                config,
                "buttonLabel",
                "Отправить запрос",
              )}
              required
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiPath">Имя endpoint в Network</Label>
            <Input
              id="apiPath"
              name="apiPath"
              defaultValue={readString(config, "path", "/request_method")}
              required
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiQuery">Query string для endpoint</Label>
            <Input
              id="apiQuery"
              name="apiQuery"
              defaultValue={queryToText(config.query) || "step=1&source=button"}
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiHeaders">Response headers</Label>
            <Textarea
              id="apiHeaders"
              name="apiHeaders"
              defaultValue={
                headersToText(config.successHeaders) ||
                "x-trace-id: qa-2026\ncontent-type: application/json"
              }
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiBody">
              Request JSON body, который уйдёт при клике
            </Label>
            <JsonEditor
              id="apiBody"
              name="apiBody"
              defaultValue={stringifyJson(
                config.body,
                '{\n  "action": "submit"\n}',
              )}
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiSuccessBody">
              JSON response body для DevTools
            </Label>
            <JsonEditor
              id="apiSuccessBody"
              name="apiSuccessBody"
              defaultValue={stringifyJson(
                config.successBody,
                '{\n  "message": "juniors never give up",\n  "hasBug": false\n}',
              )}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-grid">
              <Label htmlFor="apiAnswerPath">Путь параметра в response</Label>
              <Input
                id="apiAnswerPath"
                name="apiAnswerPath"
                defaultValue={readString(config, "answerPath", "message")}
                required
              />
            </div>
            <div className="form-grid">
              <Label htmlFor="apiExpectedAnswer">Ожидаемый ответ стажёра</Label>
              <Input
                id="apiExpectedAnswer"
                name="apiExpectedAnswer"
                defaultValue={readString(
                  config,
                  "expectedAnswer",
                  "juniors never give up",
                )}
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <Label htmlFor="apiAnswerLabel">Подпись поля ответа</Label>
            <Input
              id="apiAnswerLabel"
              name="apiAnswerLabel"
              defaultValue={readString(
                config,
                "answerLabel",
                "Введите значение поля message из response",
              )}
            />
          </div>
        </div>
      )}

      <div className="form-grid">
        <Label htmlFor="explanation">Пояснение для админа</Label>
        <Textarea
          id="explanation"
          name="explanation"
          defaultValue={question?.explanation ?? ""}
        />
      </div>
      <Button type="submit" disabled={!draftTrackId}>
        {submitLabel}
      </Button>
    </form>
  );

  if (embedded) {
    return (
      <div className="edit-question-form">
        {showTitle ? <h3 className="head-3 m-0">{title}</h3> : null}
        {form}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{form}</CardContent>
    </Card>
  );
}
