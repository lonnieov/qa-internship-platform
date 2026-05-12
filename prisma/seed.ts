import "dotenv/config";
import crypto from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { seedAdminEmail } from "../src/lib/admin-constants";
import { defaultTracks } from "../src/lib/question-classification";
import { ensureDefaultWave } from "../src/lib/waves";

const seedAdmin = {
  email: seedAdminEmail,
  password: "RESTingChat",
  firstName: "Test",
  lastName: "Admin",
};

const seedTrackMasterPassword = "TrackMaster123";

const seedTrackMasters = [
  {
    trackSlug: "qa",
    email: "qa-master@example.com",
    firstName: "QA",
    lastName: "Master",
  },
  {
    trackSlug: "hr",
    email: "hr-master@example.com",
    firstName: "HR",
    lastName: "Master",
  },
  {
    trackSlug: "mobile",
    email: "mobile-master@example.com",
    firstName: "Mobile",
    lastName: "Master",
  },
  {
    trackSlug: "backend",
    email: "backend-master@example.com",
    firstName: "Backend",
    lastName: "Master",
  },
  {
    trackSlug: "frontend",
    email: "frontend-master@example.com",
    firstName: "Frontend",
    lastName: "Master",
  },
];

function hashPassword(password: string) {
  const iterations = 310000;
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, 32, "sha256")
    .toString("hex");

  return `pbkdf2_sha256:${iterations}:${salt}:${hash}`;
}

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
  track: "QA",
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
  await prisma.profile.upsert({
    where: { email: seedAdmin.email },
    update: {
      passwordHash: hashPassword(seedAdmin.password),
      firstName: seedAdmin.firstName,
      lastName: seedAdmin.lastName,
      role: "ADMIN",
    },
    create: {
      email: seedAdmin.email,
      passwordHash: hashPassword(seedAdmin.password),
      firstName: seedAdmin.firstName,
      lastName: seedAdmin.lastName,
      role: "ADMIN",
    },
  });

  await prisma.assessmentSettings.upsert({
    where: { id: "global" },
    update: { totalTimeMinutes: 30 },
    create: { id: "global", totalTimeMinutes: 30 },
  });

  const savedTracks = await Promise.all(
    defaultTracks.map(async (track) => {
      const saved = await prisma.track.upsert({
        where: { slug: track.slug },
        update: {
          name: track.name,
          order: track.order,
          isActive: true,
        },
        create: track,
      });

      await ensureDefaultWave(saved.id);

      return saved;
    }),
  );

  const tracks = new Map<string, { id: string }>(
    savedTracks.map((track) => [track.name, track]),
  );
  const tracksBySlug = new Map(savedTracks.map((track) => [track.slug, track]));

  for (const master of seedTrackMasters) {
    const track = tracksBySlug.get(master.trackSlug);
    if (!track) continue;

    const profile = await prisma.profile.upsert({
      where: { email: master.email },
      update: {
        firstName: master.firstName,
        lastName: master.lastName,
        role: "TRACK_MASTER",
        passwordHash: hashPassword(seedTrackMasterPassword),
      },
      create: {
        email: master.email,
        firstName: master.firstName,
        lastName: master.lastName,
        role: "TRACK_MASTER",
        passwordHash: hashPassword(seedTrackMasterPassword),
      },
    });

    await prisma.trackMember.upsert({
      where: {
        profileId_trackId_role: {
          profileId: profile.id,
          trackId: track.id,
          role: "TRACK_MASTER",
        },
      },
      update: {},
      create: {
        profileId: profile.id,
        trackId: track.id,
        role: "TRACK_MASTER",
      },
    });
  }

  const count = await prisma.question.count();
  if (count > 0) return;

  for (const [index, question] of sampleQuestions.entries()) {
    await prisma.question.create({
      data: {
        text: question.text,
        track: question.track,
        trackId: tracks.get(question.track)?.id,
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
      trackId: tracks.get(sampleApiQuestion.track)?.id,
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
