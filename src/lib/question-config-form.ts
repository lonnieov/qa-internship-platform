import {
  clickSuperAppClickAvtoPresetConfig,
  manualQaPresetOptions,
  type ManualQaKnownBug,
} from "@/lib/manual-qa-sandbox";
import {
  autotestPresetOptions,
  clickAvtoTintingPresetConfig,
  type AutotestScenario,
} from "@/lib/autotest-sandbox";
import {
  getSqlSandboxConfig,
  sampleSqlSandboxConfig,
} from "@/lib/sql-sandbox-config";

/**
 * Pure form-data → sandbox-question-config transforms.
 *
 * Extracted from src/actions/admin.ts to keep the server-actions file focused on
 * orchestration (auth, persistence, revalidation) rather than the details of
 * parsing every sandbox question type's admin form. These functions have no
 * side effects and can be unit-tested in isolation.
 */

export function addMissionTranslation<T extends Record<string, unknown>>(
  apiConfig: T,
  textUz: string,
) {
  return textUz ? { ...apiConfig, missionUz: textUz } : apiConfig;
}

export function readManualQaSandboxConfig(formData: FormData, text: string) {
  const presetId = String(
    formData.get("manualQaPreset") ??
      clickSuperAppClickAvtoPresetConfig.appPreset,
  );
  const preset =
    manualQaPresetOptions.find((option) => option.value === presetId)?.config ??
    clickSuperAppClickAvtoPresetConfig;
  const scenarioTitle = String(
    formData.get("manualQaScenarioTitle") ?? preset.scenarioTitle,
  ).trim();
  const viewportWidth = Number(formData.get("manualQaViewportWidth"));
  const viewportHeight = Number(formData.get("manualQaViewportHeight"));
  const timeHintMinutes = Number(formData.get("manualQaTimeHintMinutes"));
  const categories = String(formData.get("manualQaCategories") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const knownBugsText = String(formData.get("manualQaKnownBugs") ?? "").trim();

  let knownBugs: ManualQaKnownBug[] = preset.knownBugs;
  if (knownBugsText) {
    const parsed = JSON.parse(knownBugsText);
    if (!Array.isArray(parsed)) {
      throw new Error("Known bugs must be an array.");
    }

    knownBugs = parsed
      .filter(
        (item): item is Partial<ManualQaKnownBug> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
      .map((item) => ({
        id: String(item.id ?? "").trim(),
        title: String(item.title ?? "").trim(),
        severity:
          item.severity === "blocker" ||
          item.severity === "critical" ||
          item.severity === "major" ||
          item.severity === "minor" ||
          item.severity === "trivial"
            ? item.severity
            : "major",
        matchKeywords: Array.isArray(item.matchKeywords)
          ? item.matchKeywords.map((keyword) => String(keyword)).filter(Boolean)
          : [],
      }))
      .filter((item) => item.id && item.title);
  }

  return {
    mode: "MANUAL_QA_SANDBOX" as const,
    scenarioTitle: scenarioTitle || preset.scenarioTitle,
    mission: text || preset.mission,
    appPreset: preset.appPreset,
    viewport: {
      width: Number.isFinite(viewportWidth)
        ? Math.min(Math.max(Math.round(viewportWidth), 320), 520)
        : preset.viewport.width,
      height: Number.isFinite(viewportHeight)
        ? Math.min(Math.max(Math.round(viewportHeight), 568), 980)
        : preset.viewport.height,
    },
    timeHintMinutes: Number.isFinite(timeHintMinutes)
      ? Math.min(Math.max(Math.round(timeHintMinutes), 1), 60)
      : preset.timeHintMinutes,
    bugCategories: categories.length > 0 ? categories : preset.bugCategories,
    knownBugs,
  };
}

export function readAutotestSandboxConfig(formData: FormData, text: string) {
  const presetId = String(
    formData.get("autotestPreset") ?? clickAvtoTintingPresetConfig.appPreset,
  );
  const preset =
    autotestPresetOptions.find((option) => option.value === presetId)?.config ??
    clickAvtoTintingPresetConfig;
  const scenarioTitle = String(
    formData.get("autotestScenarioTitle") ?? preset.scenarioTitle,
  ).trim();
  const timeHintMinutes = Number(formData.get("autotestTimeHintMinutes"));
  const scenariosText = String(
    formData.get("autotestExpectedScenarios") ?? "",
  ).trim();

  let expectedScenarios: AutotestScenario[] = preset.expectedScenarios;
  if (scenariosText) {
    const parsed = JSON.parse(scenariosText);
    if (!Array.isArray(parsed)) {
      throw new Error("Expected scenarios must be an array.");
    }

    expectedScenarios = parsed
      .filter(
        (item): item is Partial<AutotestScenario> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
      .map((item) => ({
        id: String(item.id ?? "").trim(),
        title: String(item.title ?? "").trim(),
        required: item.required !== false,
        matchKeywords: Array.isArray(item.matchKeywords)
          ? item.matchKeywords.map((kw) => String(kw)).filter(Boolean)
          : [],
      }))
      .filter((item) => item.id && item.title);
  }

  return {
    mode: "AUTOTEST_SANDBOX" as const,
    scenarioTitle: scenarioTitle || preset.scenarioTitle,
    mission: text || preset.mission,
    appPreset: preset.appPreset,
    timeHintMinutes: Number.isFinite(timeHintMinutes)
      ? Math.min(Math.max(Math.round(timeHintMinutes), 5), 60)
      : preset.timeHintMinutes,
    availableMethods: preset.availableMethods,
    expectedScenarios,
    exampleCode: preset.exampleCode,
  };
}

export function readSqlSandboxConfig(formData: FormData, text: string) {
  const taskTitle = String(
    formData.get("sqlTaskTitle") ?? sampleSqlSandboxConfig.taskTitle,
  ).trim();
  const tablesText = String(formData.get("sqlTables") ?? "").trim();
  const expectedText = String(formData.get("sqlExpectedResult") ?? "").trim();

  const config = getSqlSandboxConfig({
    mode: "SQL_SANDBOX",
    taskTitle,
    mission: text,
    dialect: sampleSqlSandboxConfig.dialect,
    tables: tablesText ? JSON.parse(tablesText) : sampleSqlSandboxConfig.tables,
    expectedResult: expectedText
      ? JSON.parse(expectedText)
      : sampleSqlSandboxConfig.expectedResult,
  });

  if (!config) {
    throw new Error("Invalid SQL sandbox config");
  }

  return config;
}
