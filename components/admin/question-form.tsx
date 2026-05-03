"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  getManualQaPresetConfig,
  getManualQaSandboxConfig,
  manualQaPresetOptions,
} from "@/lib/manual-qa-sandbox";
import {
  autotestPresetOptions,
  clickAvtoTintingPresetConfig,
  getAutotestPresetConfig,
  getAutotestSandboxConfig,
} from "@/lib/autotest-sandbox";
import {
  getSqlSandboxConfig,
  sampleSqlSandboxConfig,
} from "@/lib/sql-sandbox-config";

type QuestionType =
  | "QUIZ"
  | "API_SANDBOX"
  | "SQL_SANDBOX"
  | "DEVTOOLS_SANDBOX"
  | "MANUAL_QA_SANDBOX"
  | "AUTOTEST_SANDBOX";
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

function getQuestionTypeLabel(t: ReturnType<typeof useTranslations>, type: QuestionType) {
  if (type === "API_SANDBOX") return t("typeLabels.api");
  if (type === "SQL_SANDBOX") return t("typeLabels.sql");
  if (type === "DEVTOOLS_SANDBOX") return t("typeLabels.devtools");
  if (type === "MANUAL_QA_SANDBOX") return t("typeLabels.manualQa");
  if (type === "AUTOTEST_SANDBOX") return t("typeLabels.autotest");
  return t("typeLabels.quiz");
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
  const t = useTranslations("AdminQuestionForm");
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
  const sqlSandboxConfig =
    getSqlSandboxConfig(question?.apiConfig) ?? sampleSqlSandboxConfig;
  const initialManualQaConfig =
    getManualQaSandboxConfig(question?.apiConfig) ??
    clickSuperAppClickAvtoPresetConfig;
  const [draftManualQaPresetId, setDraftManualQaPresetId] = useState(
    initialManualQaConfig.appPreset,
  );
  const selectedManualQaPresetConfig = getManualQaPresetConfig(
    draftManualQaPresetId,
  );
  const manualQaConfig =
    draftManualQaPresetId === initialManualQaConfig.appPreset
      ? initialManualQaConfig
      : selectedManualQaPresetConfig;

  const initialAutotestConfig =
    getAutotestSandboxConfig(question?.apiConfig) ?? clickAvtoTintingPresetConfig;
  const [draftAutotestPresetId, setDraftAutotestPresetId] = useState(
    initialAutotestConfig.appPreset,
  );
  const autotestConfig =
    draftAutotestPresetId === initialAutotestConfig.appPreset
      ? initialAutotestConfig
      : getAutotestPresetConfig(draftAutotestPresetId);
  const isEditing = Boolean(question);
  const sortedOptions = [...(question?.options ?? [])].sort(
    (left, right) => left.order - right.order,
  );

  const title = isEditing ? t("title.edit") : t("title.new");
  const action = isEditing ? updateQuestionAction : createQuestionAction;
  const submitLabel = isEditing ? t("submit.save") : t("submit.add");
  const defaultQuestionText =
    questionType === "MANUAL_QA_SANDBOX" &&
    draftManualQaPresetId !== initialManualQaConfig.appPreset
      ? manualQaConfig.mission
      : questionType === "AUTOTEST_SANDBOX" &&
          draftAutotestPresetId !== initialAutotestConfig.appPreset
        ? autotestConfig.mission
        : (question?.text ??
          (questionType === "QUIZ"
            ? t("defaults.quizPrompt")
            : questionType === "API_SANDBOX"
              ? t("defaults.apiPrompt")
              : questionType === "SQL_SANDBOX"
                ? sqlSandboxConfig.mission
                : questionType === "MANUAL_QA_SANDBOX"
                  ? manualQaConfig.mission
                  : questionType === "AUTOTEST_SANDBOX"
                    ? autotestConfig.mission
                    : t("defaults.devtoolsPrompt")));
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
          draftTrack?.name ?? (question ? getTrackDisplayName(question) : "QA")
        }
      />

      {!isEditing && !lockType ? (
        <div className="form-grid">
          <Label>{t("questionType")}</Label>
          <div className="question-form-choice-grid">
            {[
              ["QUIZ", t("typeLabels.quiz")],
              ["API_SANDBOX", t("typeLabels.api")],
              ["SQL_SANDBOX", t("typeLabels.sql")],
              ["DEVTOOLS_SANDBOX", t("typeLabels.devtools")],
              ["MANUAL_QA_SANDBOX", t("typeLabels.manualQa")],
              ["AUTOTEST_SANDBOX", t("typeLabels.autotest")],
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
          <Label>{t("questionType")}</Label>
          <span className="type-chip">{getQuestionTypeLabel(t, questionType)}</span>
        </div>
      )}

      <div className="form-grid">
        <Label>{t("classification")}</Label>
        <div className="question-form-choice-grid">
          {selectableTracks.map((track) => {
            const meta = getQuestionTrackMeta(track);
            return (
              <label
                className="question-form-choice"
                key={track.id ?? track.slug}
              >
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
            {t("createTrackFirst")}
          </p>
        ) : null}
      </div>

      <div className="form-grid">
        <Label htmlFor="text">
          {questionType === "QUIZ"
            ? t("fields.questionText")
            : questionType === "SQL_SANDBOX"
              ? t("fields.sqlMission")
              : questionType === "MANUAL_QA_SANDBOX"
                ? t("fields.manualMission")
                : questionType === "AUTOTEST_SANDBOX"
                  ? t("fields.autotestMission")
                  : t("fields.apiMission")}
        </Label>
        <Textarea
          id="text"
          key={`${questionType}-${manualQaConfig.appPreset}`}
          name="text"
          defaultValue={defaultQuestionText}
          required
        />
      </div>

      {questionType === "QUIZ" ? (
        <div className="stack">
          {!isEditing ? (
            <div className="form-grid">
              <Label>{t("quizMode")}</Label>
              <div className="question-form-choice-grid">
                {[
                  ["CHOICE", t("quizModes.choice")],
                  ["OPEN_TEXT", t("quizModes.openText")],
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
              <Label>{t("quizMode")}</Label>
              <div className="question-form-choice-grid">
                {[
                  ["CHOICE", t("quizModes.choice")],
                  ["OPEN_TEXT", t("quizModes.openText")],
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
                <Label htmlFor="openExpectedAnswer">{t("open.answerKey")}</Label>
                <Textarea
                  id="openExpectedAnswer"
                  name="openExpectedAnswer"
                  defaultValue={openQuizConfig?.expectedAnswer ?? ""}
                  placeholder={t("open.answerKeyPlaceholder")}
                />
              </div>
              <div className="grid-2">
                <div className="form-grid">
                  <Label htmlFor="openAnswerLabel">{t("open.answerLabel")}</Label>
                  <Input
                    id="openAnswerLabel"
                    name="openAnswerLabel"
                    defaultValue={openQuizConfig?.answerLabel ?? ""}
                    placeholder={t("open.answerLabelPlaceholder")}
                  />
                </div>
                <div className="form-grid">
                  <Label htmlFor="openPlaceholder">{t("open.placeholderLabel")}</Label>
                  <Input
                    id="openPlaceholder"
                    name="openPlaceholder"
                    defaultValue={openQuizConfig?.placeholder ?? ""}
                    placeholder={t("open.placeholder")}
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
                      {t("choice.option")} {String.fromCharCode(65 + index)}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`option-${index}`}
                        name={`option-${index}`}
                        defaultValue={
                          option?.text ??
                          [
                            t("defaults.choiceA"),
                            t("defaults.choiceB"),
                            t("defaults.choiceC"),
                            t("defaults.choiceD"),
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
                        {t("choice.correct")}
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
              <Label htmlFor="apiMethod">{t("api.expectedMethod")}</Label>
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
              <Label htmlFor="apiSuccessStatus">{t("api.successStatus")}</Label>
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
            <Label htmlFor="apiPath">{t("api.expectedPath")}</Label>
            <Input
              id="apiPath"
              name="apiPath"
              defaultValue={readString(config, "path", "/users")}
              required
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiQuery">{t("api.expectedQuery")}</Label>
            <Input
              id="apiQuery"
              name="apiQuery"
              defaultValue={
                queryToText(config.query) || "status=active&limit=10"
              }
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiHeaders">{t("api.requiredHeaders")}</Label>
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
            <Label htmlFor="apiBody">{t("api.expectedBody")}</Label>
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
            <Label htmlFor="apiSuccessBody">{t("api.successBody")}</Label>
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
      ) : questionType === "SQL_SANDBOX" ? (
        <div className="stack">
          <div className="form-grid">
            <Label htmlFor="sqlTaskTitle">{t("sql.taskTitle")}</Label>
            <Input
              id="sqlTaskTitle"
              name="sqlTaskTitle"
              defaultValue={sqlSandboxConfig.taskTitle}
              required
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="sqlTables">{t("sql.tables")}</Label>
            <JsonEditor
              id="sqlTables"
              name="sqlTables"
              defaultValue={stringifyJson(
                sqlSandboxConfig.tables,
                stringifyJson(sampleSqlSandboxConfig.tables, "[]"),
              )}
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="sqlExpectedResult">{t("sql.expectedResult")}</Label>
            <JsonEditor
              id="sqlExpectedResult"
              name="sqlExpectedResult"
              defaultValue={stringifyJson(
                sqlSandboxConfig.expectedResult,
                stringifyJson(sampleSqlSandboxConfig.expectedResult, "{}"),
              )}
            />
          </div>

          <div className="soft-panel stack">
            <strong>{t("sql.autoTitle")}</strong>
            <p className="body-2 muted m-0">
              {t("sql.autoDescription")}
            </p>
          </div>
        </div>
      ) : questionType === "MANUAL_QA_SANDBOX" ? (
        <div className="stack">
          <div className="form-grid">
            <Label htmlFor="manualQaPreset">{t("manual.preset")}</Label>
            <Select
              id="manualQaPreset"
              name="manualQaPreset"
              onChange={(event) => setDraftManualQaPresetId(event.target.value)}
              value={draftManualQaPresetId}
            >
              {manualQaPresetOptions.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="form-grid" key={manualQaConfig.appPreset}>
            <div className="form-grid">
              <Label htmlFor="manualQaScenarioTitle">{t("manual.scenarioTitle")}</Label>
              <Input
                id="manualQaScenarioTitle"
                name="manualQaScenarioTitle"
                defaultValue={manualQaConfig.scenarioTitle}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-grid">
                <Label htmlFor="manualQaViewportWidth">
                  {t("manual.viewportWidth")}
                </Label>
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
                <Label htmlFor="manualQaViewportHeight">
                  {t("manual.viewportHeight")}
                </Label>
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
                <Label htmlFor="manualQaTimeHintMinutes">
                  {t("manual.recommendedMinutes")}
                </Label>
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
                  {t("manual.categories")}
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
              <Label htmlFor="manualQaKnownBugs">
                {t("manual.knownBugsRubric")}
              </Label>
              <JsonEditor
                id="manualQaKnownBugs"
                name="manualQaKnownBugs"
                defaultValue={stringifyJson(
                  manualQaConfig.knownBugs,
                  stringifyJson(selectedManualQaPresetConfig.knownBugs, "[]"),
                )}
              />
            </div>
          </div>

          <div className="soft-panel stack">
            <strong>{t("manual.reviewTitle")}</strong>
            <p className="body-2 muted m-0">
              {t("manual.reviewDescription")}
            </p>
          </div>
        </div>
      ) : questionType === "AUTOTEST_SANDBOX" ? (
        <div className="stack">
          <div className="form-grid">
            <Label htmlFor="autotestPreset">{t("autotest.preset")}</Label>
            <Select
              id="autotestPreset"
              name="autotestPreset"
              onChange={(event) => setDraftAutotestPresetId(event.target.value)}
              value={draftAutotestPresetId}
            >
              {autotestPresetOptions.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="form-grid" key={autotestConfig.appPreset}>
            <div className="form-grid">
              <Label htmlFor="autotestScenarioTitle">
                {t("autotest.scenarioTitle")}
              </Label>
              <Input
                id="autotestScenarioTitle"
                name="autotestScenarioTitle"
                defaultValue={autotestConfig.scenarioTitle}
                required
              />
            </div>

            <div className="form-grid">
              <Label htmlFor="autotestTimeHintMinutes">
                {t("autotest.recommendedMinutes")}
              </Label>
              <Input
                id="autotestTimeHintMinutes"
                name="autotestTimeHintMinutes"
                type="number"
                min="5"
                max="60"
                defaultValue={autotestConfig.timeHintMinutes}
                required
              />
            </div>

            <div className="form-grid">
              <Label htmlFor="autotestExpectedScenarios">
                {t("autotest.expectedScenarios")}
              </Label>
              <JsonEditor
                id="autotestExpectedScenarios"
                name="autotestExpectedScenarios"
                defaultValue={stringifyJson(
                  autotestConfig.expectedScenarios,
                  "[]",
                )}
              />
            </div>
          </div>

          <div className="soft-panel stack">
            <strong>{t("autotest.reviewTitle")}</strong>
            <p className="body-2 muted m-0">
              {t("autotest.reviewDescription")}
            </p>
          </div>
        </div>
      ) : (
        <div className="stack">
          <div className="grid-2">
            <div className="form-grid">
              <Label htmlFor="apiMethod">{t("devtools.networkMethod")}</Label>
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
              <Label htmlFor="apiSuccessStatus">{t("devtools.responseStatus")}</Label>
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
            <Label htmlFor="apiButtonLabel">{t("devtools.buttonLabel")}</Label>
            <Input
              id="apiButtonLabel"
              name="apiButtonLabel"
              defaultValue={readString(
                config,
                "buttonLabel",
                t("devtools.buttonDefault"),
              )}
              required
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiPath">{t("devtools.endpointName")}</Label>
            <Input
              id="apiPath"
              name="apiPath"
              defaultValue={readString(config, "path", "/request_method")}
              required
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiQuery">{t("devtools.endpointQuery")}</Label>
            <Input
              id="apiQuery"
              name="apiQuery"
              defaultValue={queryToText(config.query) || "step=1&source=button"}
            />
          </div>

          <div className="form-grid">
            <Label htmlFor="apiHeaders">{t("devtools.responseHeaders")}</Label>
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
              {t("devtools.requestBody")}
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
              {t("devtools.responseBody")}
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
              <Label htmlFor="apiAnswerPath">{t("devtools.answerPath")}</Label>
              <Input
                id="apiAnswerPath"
                name="apiAnswerPath"
                defaultValue={readString(config, "answerPath", "message")}
                required
              />
            </div>
            <div className="form-grid">
              <Label htmlFor="apiExpectedAnswer">{t("devtools.expectedAnswer")}</Label>
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
            <Label htmlFor="apiAnswerLabel">{t("devtools.answerLabel")}</Label>
            <Input
              id="apiAnswerLabel"
              name="apiAnswerLabel"
              defaultValue={readString(
                config,
                "answerLabel",
                t("devtools.answerLabelDefault"),
              )}
            />
          </div>
        </div>
      )}

      <div className="form-grid">
        <Label htmlFor="explanation">{t("adminNote")}</Label>
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
