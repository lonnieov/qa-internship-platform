import { prisma } from "../src/lib/prisma";

const sampleQuestions = [
  {
    track: "QA",
    text: "Что такое smoke testing?",
    options: [
      "Быстрая проверка критичного функционала после сборки",
      "Полное регрессионное тестирование",
      "Тестирование только интерфейса",
      "Проверка производительности под нагрузкой",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Какой статус баг-репорта означает, что дефект исправлен разработчиком?",
    options: ["Open", "Fixed", "Rejected", "Duplicate"],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что обязательно должно быть в хорошем баг-репорте?",
    options: [
      "Название, шаги, фактический и ожидаемый результат",
      "Только скриншот",
      "Только имя тестировщика",
      "Только ссылка на задачу",
    ],
    correctIndex: 0,
  },
];

const sampleApiQuestion = {
  track: "API",
  text: "Отправьте запрос на создание пользователя Ali Valiyev и добейтесь ответа 201 Created.",
  explanation:
    "Проверяется сборка POST-запроса, header авторизации и корректный JSON body.",
  apiConfig: {
    method: "POST",
    path: "/users",
    headers: {
      authorization: "Bearer test-token",
      "content-type": "application/json",
    },
    body: {
      name: "Ali Valiyev",
    },
    successStatus: 201,
    successBody: {
      id: 101,
      name: "Ali Valiyev",
      created: true,
    },
  },
};

async function main() {
  await prisma.assessmentSettings.upsert({
    where: { id: "global" },
    update: { totalTimeMinutes: 30 },
    create: { id: "global", totalTimeMinutes: 30 },
  });

  const count = await prisma.question.count();
  if (count > 0) return;

  for (const [index, question] of sampleQuestions.entries()) {
    await prisma.question.create({
      data: {
        text: question.text,
        track: question.track,
        order: index + 1,
        options: {
          create: question.options.map((option, optionIndex) => ({
            label: String.fromCharCode(65 + optionIndex),
            text: option,
            order: optionIndex,
            isCorrect: optionIndex === question.correctIndex,
          })),
        },
      },
    });
  }

  await prisma.question.create({
    data: {
      type: "API_SANDBOX",
      text: sampleApiQuestion.text,
      track: sampleApiQuestion.track,
      explanation: sampleApiQuestion.explanation,
      order: sampleQuestions.length + 1,
      apiConfig: sampleApiQuestion.apiConfig,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
