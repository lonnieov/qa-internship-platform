export type AutotestMethod = {
  name: string;
  signature: string;
  description: string;
  example: string;
};

export type AutotestScenario = {
  id: string;
  title: string;
  required: boolean;
  matchKeywords: string[];
};

export type AutotestSandboxConfig = {
  mode: "AUTOTEST_SANDBOX";
  scenarioTitle: string;
  mission: string;
  appPreset: string;
  timeHintMinutes: number;
  availableMethods: AutotestMethod[];
  expectedScenarios: AutotestScenario[];
  exampleCode?: string;
};

export type AutotestAnswerPayload = {
  mode: "AUTOTEST_SANDBOX";
  code: string;
};

export type AutotestAnswerSummary = {
  matchedScenarioIds: string[];
  requiredTotal: number;
  requiredMatched: number;
};

// --- Built-in method list (shared across all presets) ---

export const defaultAutotestMethods: AutotestMethod[] = [
  {
    name: "tap",
    signature: "tap(element: string)",
    description: "Тап по элементу",
    example: "tap('Кнопка Оплатить')",
  },
  {
    name: "doubleTap",
    signature: "doubleTap(element: string)",
    description: "Двойной тап",
    example: "doubleTap('Поле суммы')",
  },
  {
    name: "longPress",
    signature: "longPress(element: string, ms?: number)",
    description: "Долгий тап",
    example: "longPress('Карточка авто', 1000)",
  },
  {
    name: "swipe",
    signature: "swipe(direction: 'up'|'down'|'left'|'right', element?: string)",
    description: "Свайп",
    example: "swipe('up')",
  },
  {
    name: "scroll",
    signature: "scroll(direction: 'up'|'down', element?: string)",
    description: "Скролл внутри контейнера",
    example: "scroll('down', 'Список услуг')",
  },
  {
    name: "fingerDown",
    signature: "fingerDown(x: number, y: number)",
    description: "Нажать пальцем в точку (начало жеста)",
    example: "fingerDown(195, 400)",
  },
  {
    name: "fingerUp",
    signature: "fingerUp(x: number, y: number)",
    description: "Отпустить палец (конец жеста)",
    example: "fingerUp(195, 600)",
  },
  {
    name: "enterText",
    signature: "enterText(element: string, text: string)",
    description: "Ввести текст в поле",
    example: "enterText('Номер авто', '01A777AA')",
  },
  {
    name: "clearText",
    signature: "clearText(element: string)",
    description: "Очистить поле",
    example: "clearText('Номер авто')",
  },
  {
    name: "navigateTo",
    signature: "navigateTo(screen: string)",
    description: "Перейти на экран",
    example: "navigateTo('Тонировка')",
  },
  {
    name: "goBack",
    signature: "goBack()",
    description: "Нажать кнопку назад",
    example: "goBack()",
  },
  {
    name: "expect",
    signature: "expect(element: string).toBeVisible()",
    description: "Проверить, что элемент виден",
    example: "expect('Успешно').toBeVisible()",
  },
  {
    name: "expectText",
    signature: "expect(element: string).toHaveText(text: string)",
    description: "Проверить текст элемента",
    example: "expect('Итого').toHaveText('15 000 UZS')",
  },
  {
    name: "expectEnabled",
    signature: "expect(element: string).toBeEnabled()",
    description: "Проверить, что элемент активен",
    example: "expect('Кнопка Оплатить').toBeEnabled()",
  },
  {
    name: "expectDisabled",
    signature: "expect(element: string).toBeDisabled()",
    description: "Проверить, что элемент неактивен",
    example: "expect('Кнопка Оплатить').toBeDisabled()",
  },
  {
    name: "waitFor",
    signature: "waitFor(element: string, timeout?: number)",
    description: "Ждать появления элемента",
    example: "waitFor('Экран оплаты', 3000)",
  },
  {
    name: "wait",
    signature: "wait(ms: number)",
    description: "Пауза",
    example: "wait(500)",
  },
  {
    name: "log",
    signature: "log(message: string)",
    description: "Вывести сообщение в лог",
    example: "log('Открыт экран тонировки')",
  },
];

// --- Preset: ClickAvto — тонировка ---

export const clickAvtoTintingPresetConfig: AutotestSandboxConfig = {
  mode: "AUTOTEST_SANDBOX",
  scenarioTitle: "ClickAvto: оплата тонировки",
  mission:
    "Напишите псевдокод автотестов для проверки сценариев оплаты услуги «Тонировка» в miniapp ClickAvto. Используйте предоставленные методы. Покройте счастливый путь и негативные сценарии.",
  appPreset: "click-avto-tinting-v1",
  timeHintMinutes: 20,
  availableMethods: defaultAutotestMethods,
  expectedScenarios: [
    {
      id: "navigate-to-tinting",
      title: "Открыть раздел тонировки",
      required: true,
      // только то, что показано стажёру: названия методов + элементы из примера
      matchKeywords: ["navigateTo", "Тонировка", "ClickAvto"],
    },
    {
      id: "select-vehicle",
      title: "Выбрать автомобиль",
      required: true,
      matchKeywords: ["tap", "Мой автомобиль"],
    },
    {
      id: "happy-path-payment",
      title: "Успешная оплата — tap по кнопке оплаты",
      required: true,
      matchKeywords: ["tap", "Оплатить"],
    },
    {
      id: "payment-confirmation",
      title: "Проверить экран подтверждения",
      required: true,
      matchKeywords: ["expect", "toBeVisible", "Оплата прошла успешно"],
    },
    {
      id: "no-vehicle-selected",
      title: "Негатив: кнопка заблокирована без выбора авто",
      required: false,
      matchKeywords: ["toBeDisabled", "toBeEnabled"],
    },
    {
      id: "back-navigation",
      title: "Возврат назад — goBack",
      required: false,
      matchKeywords: ["goBack"],
    },
  ],
  exampleCode: `// Пример структуры псевдокода:
// test('Название сценария', () => {
//   navigateTo('Экран')
//   tap('Элемент')
//   expect('Результат').toBeVisible()
// })

test('Успешная оплата тонировки', () => {
  navigateTo('ClickAvto')
  tap('Тонировка')
  tap('Мой автомобиль')
  tap('Оплатить')
  expect('Оплата прошла успешно').toBeVisible()
})`,
};

// --- Preset registry ---

export const autotestPresetOptions = [
  {
    value: clickAvtoTintingPresetConfig.appPreset,
    label: "ClickAvto / Тонировка",
    config: clickAvtoTintingPresetConfig,
  },
] as const;

export function getAutotestPresetConfig(appPreset: string | undefined) {
  return (
    autotestPresetOptions.find((opt) => opt.value === appPreset)?.config ??
    clickAvtoTintingPresetConfig
  );
}

export function getAutotestSandboxConfig(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const config = value as Partial<AutotestSandboxConfig>;
  if (config.mode !== "AUTOTEST_SANDBOX") return null;

  const preset = getAutotestPresetConfig(config.appPreset);

  return {
    ...preset,
    ...config,
    availableMethods:
      Array.isArray(config.availableMethods) && config.availableMethods.length > 0
        ? config.availableMethods
        : preset.availableMethods,
    expectedScenarios:
      Array.isArray(config.expectedScenarios) && config.expectedScenarios.length > 0
        ? config.expectedScenarios
        : preset.expectedScenarios,
  } satisfies AutotestSandboxConfig;
}

export function getAutotestAnswerPayload(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (value as Record<string, unknown>).mode !== "AUTOTEST_SANDBOX"
  ) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  return {
    mode: "AUTOTEST_SANDBOX" as const,
    code: typeof raw.code === "string" ? raw.code : "",
  };
}

export function summarizeAutotestAnswer(
  code: string,
  config: AutotestSandboxConfig | null,
): AutotestAnswerSummary {
  const lower = code.toLowerCase();
  const matchedScenarioIds: string[] = [];

  for (const scenario of config?.expectedScenarios ?? []) {
    const matched = scenario.matchKeywords.some((kw) =>
      lower.includes(kw.toLowerCase()),
    );
    if (matched) matchedScenarioIds.push(scenario.id);
  }

  const requiredScenarios = (config?.expectedScenarios ?? []).filter(
    (s) => s.required,
  );
  const requiredTotal = requiredScenarios.length;
  const requiredMatched = requiredScenarios.filter((s) =>
    matchedScenarioIds.includes(s.id),
  ).length;

  return {
    matchedScenarioIds,
    requiredTotal,
    requiredMatched,
  };
}
