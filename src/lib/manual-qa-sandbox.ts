export type ManualQaKnownBug = {
  id: string;
  title: string;
  severity: "blocker" | "critical" | "major" | "minor" | "trivial";
  matchKeywords: string[];
};

export type ManualQaSandboxConfig = {
  mode: "MANUAL_QA_SANDBOX";
  scenarioTitle: string;
  mission: string;
  appPreset: string;
  viewport: {
    width: number;
    height: number;
  };
  timeHintMinutes: number;
  bugCategories: string[];
  knownBugs: ManualQaKnownBug[];
};

export type ManualQaBugReport = {
  id: string;
  title: string;
  severity: "blocker" | "critical" | "major" | "minor" | "trivial";
  category: string;
  steps: string;
  actual: string;
  expected: string;
  note?: string;
};

export type ManualQaAnswerPayload = {
  mode: "MANUAL_QA_SANDBOX";
  reports: ManualQaBugReport[];
  noBugsFound: boolean;
};

export type ManualQaAnswerSummary = {
  reportCount: number;
  matchedKnownBugIds: string[];
  unmatchedReportCount: number;
};

export const clickSuperAppClickAvtoPresetConfig = {
  mode: "MANUAL_QA_SANDBOX",
  scenarioTitle: "ClickSuperApp: ClickAvto mobile miniapp",
  mission:
    "Проверьте miniapp ClickAvto внутри ClickSuperApp: выбор авто, услуга, промокод, оплата и возврат назад.",
  appPreset: "click-super-app-click-avto-v1",
  viewport: { width: 390, height: 844 },
  timeHintMinutes: 12,
  bugCategories: [
    "functional",
    "validation",
    "calculation",
    "navigation",
    "mobile-ui",
    "payment",
  ],
  knownBugs: [
    {
      id: "avto-empty-plate-allowed",
      title: "Можно продолжить оформление с пустым номером автомобиля",
      severity: "major",
      matchKeywords: ["plate", "номер", "empty", "пуст", "validation"],
    },
    {
      id: "avto-insurance-total-not-updated",
      title: "Итоговая сумма не меняется после включения защиты поездки",
      severity: "major",
      matchKeywords: ["total", "итог", "insurance", "защит", "сумма"],
    },
    {
      id: "avto-promo-applies-multiple-times",
      title: "Промокод можно применить несколько раз",
      severity: "critical",
      matchKeywords: ["promo", "промокод", "discount", "скид"],
    },
    {
      id: "avto-back-loses-car-state",
      title: "Возврат назад с экрана оплаты теряет выбранное авто",
      severity: "major",
      matchKeywords: ["back", "назад", "lost", "теря", "vehicle", "авто"],
    },
    {
      id: "avto-payment-without-method",
      title: "Оплата проходит без выбранного способа оплаты",
      severity: "critical",
      matchKeywords: ["payment", "оплата", "card", "method", "карта"],
    },
    {
      id: "avto-long-car-name-overflows",
      title: "Длинное название автомобиля ломает карточку сохранённого авто",
      severity: "minor",
      matchKeywords: ["long", "длин", "overflow", "layout", "карточ"],
    },
  ],
} satisfies ManualQaSandboxConfig;

export const manualQaPresetOptions = [
  {
    value: clickSuperAppClickAvtoPresetConfig.appPreset,
    label: "ClickSuperApp / ClickAvto",
    config: clickSuperAppClickAvtoPresetConfig,
  },
] as const;

export function getManualQaSandboxConfig(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const config = value as Partial<ManualQaSandboxConfig>;
  if (config.mode !== "MANUAL_QA_SANDBOX") return null;

  return {
    ...clickSuperAppClickAvtoPresetConfig,
    ...config,
    viewport: {
      ...clickSuperAppClickAvtoPresetConfig.viewport,
      ...(config.viewport && typeof config.viewport === "object"
        ? config.viewport
        : {}),
    },
    bugCategories: Array.isArray(config.bugCategories)
      ? config.bugCategories.filter((item) => typeof item === "string")
      : clickSuperAppClickAvtoPresetConfig.bugCategories,
    knownBugs: Array.isArray(config.knownBugs)
      ? config.knownBugs.filter(
          (item): item is ManualQaKnownBug =>
            Boolean(item) &&
            typeof item === "object" &&
            !Array.isArray(item) &&
            typeof (item as ManualQaKnownBug).id === "string" &&
            typeof (item as ManualQaKnownBug).title === "string",
        )
      : clickSuperAppClickAvtoPresetConfig.knownBugs,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function cleanSeverity(value: unknown): ManualQaBugReport["severity"] {
  return value === "blocker" ||
    value === "critical" ||
    value === "major" ||
    value === "minor" ||
    value === "trivial"
    ? value
    : "major";
}

export function normalizeManualQaReports(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map((item, index) => ({
      id: cleanText(item.id, 80) || `report-${index + 1}`,
      title: cleanText(item.title, 160),
      severity: cleanSeverity(item.severity),
      category: cleanText(item.category, 80) || "functional",
      steps: cleanText(item.steps, 1600),
      actual: cleanText(item.actual, 800),
      expected: cleanText(item.expected, 800),
      note: cleanText(item.note, 800) || undefined,
    }))
    .filter(
      (item) => item.title || item.steps || item.actual || item.expected,
    );
}

export function getManualQaAnswerPayload(value: unknown) {
  if (!isRecord(value) || value.mode !== "MANUAL_QA_SANDBOX") return null;

  return {
    mode: "MANUAL_QA_SANDBOX" as const,
    reports: normalizeManualQaReports(value.reports),
    noBugsFound: value.noBugsFound === true,
  };
}

export function summarizeManualQaAnswer(
  reports: ManualQaBugReport[],
  config: ManualQaSandboxConfig | null,
): ManualQaAnswerSummary {
  const matchedKnownBugIds = new Set<string>();

  for (const report of reports) {
    const haystack = [
      report.title,
      report.category,
      report.steps,
      report.actual,
      report.expected,
      report.note,
    ]
      .join(" ")
      .toLowerCase();

    for (const knownBug of config?.knownBugs ?? []) {
      if (
        knownBug.matchKeywords.some((keyword) =>
          haystack.includes(keyword.toLowerCase()),
        )
      ) {
        matchedKnownBugIds.add(knownBug.id);
      }
    }
  }

  return {
    reportCount: reports.length,
    matchedKnownBugIds: [...matchedKnownBugIds],
    unmatchedReportCount: Math.max(0, reports.length - matchedKnownBugIds.size),
  };
}
