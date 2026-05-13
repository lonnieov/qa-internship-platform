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
    text: "Что в первую очередь является целью smoke-тестирования?",
    options: [
      "Проверка всех возможных негативных сценариев",
      "Проверка критичного функционала на работоспособность",
      "Проверка производительности системы",
      "Проверка совместимости браузеров",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: 'Что лучше всего подходит для проверки граничных значений поля "Возраст"?',
    options: [
      "0, 18, 65, 66",
      "Только 18 и 65",
      "1, 10, 100",
      "Любые случайные числа",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Что является expected result в тест-кейсе?",
    options: [
      "Описание шагов пользователя",
      "Причина возникновения бага",
      "Ожидаемое поведение системы",
      "Название теста",
    ],
    correctIndex: 2,
  },
  {
    track: "QA",
    text: "Что означает HTTP статус 404?",
    options: [
      "Сервер временно недоступен",
      "Ошибка авторизации",
      "Ресурс не найден",
      "Ошибка в теле запроса",
    ],
    correctIndex: 2,
  },
  {
    track: "QA",
    text: "Какой инструмент браузера чаще всего используется для анализа API-запросов?",
    options: ["Elements", "Console", "Network", "Sources"],
    correctIndex: 2,
  },
  {
    track: "QA",
    text: "Что чаще всего относится к негативному тестированию?",
    options: [
      "Проверка валидных данных",
      "Проверка интерфейса",
      "Проверка поведения при некорректных данных",
      "Проверка скорости загрузки страницы",
    ],
    correctIndex: 2,
  },
  {
    track: "QA",
    text: "Какой риск наиболее вероятен при отсутствии валидации поля суммы?",
    options: [
      "Медленная анимация",
      "Ввод некорректных значений",
      "Изменение цвета кнопки",
      "Потеря интернет-соединения",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что из перечисленного относится к frontend?",
    options: [
      "SQL-запросы",
      "База данных",
      "Интерфейс пользователя",
      "Сервер приложения",
    ],
    correctIndex: 2,
  },
  {
    track: "QA",
    text: "Какой тип тестирования проверяет взаимодействие между модулями?",
    options: ["Unit", "Integration", "UI", "Regression"],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что такое regression testing?",
    options: [
      "Проверка новой функции один раз",
      "Повторная проверка существующего функционала после изменений",
      "Проверка только UI",
      "Проверка API без интерфейса",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что означает flaky test?",
    options: [
      "Тест без expected result",
      "Тест, который иногда проходит, а иногда падает без изменений",
      "Очень долгий тест",
      "Тест без шагов",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что важно проверить у обязательного поля формы?",
    options: [
      "Цвет placeholder",
      "Реакцию на пустое значение",
      "Скорость анимации",
      "Размер шрифта браузера",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Какой символ чаще всего используется в XPath для поиска атрибута?",
    options: ["#", "@", "&", "%"],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что лучше всего описывает bug reproduction steps?",
    options: [
      "Причину бага",
      "Последовательность действий для повторения проблемы",
      "Название задачи",
      "Комментарий разработчика",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что проверяет compatibility testing?",
    options: [
      "Скорость API",
      "Совместимость с окружениями и устройствами",
      "SQL-запросы",
      "Корректность логов",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Какой HTTP-метод обычно используется для получения данных?",
    options: ["PUT", "POST", "GET", "DELETE"],
    correctIndex: 2,
  },
  {
    track: "QA",
    text: "Что такое test data?",
    options: [
      "Код приложения",
      "Данные, используемые при тестировании",
      "Логи сервера",
      "Документация проекта",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что из перечисленного является примером severity High?",
    options: [
      "Опечатка в footer",
      "Не работает авторизация",
      "Неровный отступ кнопки",
      "Некорректный favicon",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что означает HTTP статус 500?",
    options: [
      "Ошибка клиента",
      "Ошибка маршрутизации",
      "Внутренняя ошибка сервера",
      "Успешный запрос",
    ],
    correctIndex: 2,
  },
  {
    track: "QA",
    text: "Что полезнее всего приложить к баг-репорту?",
    options: [
      "Мем",
      "Скриншот или видео проблемы",
      "Случайный лог",
      "Имя тестировщика",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что такое API?",
    options: [
      "Интерфейс взаимодействия между системами",
      "База данных",
      "Тип браузера",
      "Язык программирования",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Какой тип проверки помогает убедиться, что исправление не сломало старую функциональность?",
    options: ["Smoke", "Regression", "UI", "Accessibility"],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что важно проверить при тестировании поля email?",
    options: [
      "Поддержку валидного формата",
      "Цвет текста",
      "Скорость загрузки страницы",
      "Размер кнопки",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Что может помочь локализовать источник бага?",
    options: [
      "DevTools и логи",
      "Перезагрузка ноутбука",
      "Очистка корзины",
      "Смена браузера без проверки",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Что такое UI testing?",
    options: [
      "Проверка интерфейса пользователя",
      "Проверка SQL",
      "Проверка backend логики",
      "Проверка DNS",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: 'Что из перечисленного лучше всего подходит для проверки поля "Телефон"?',
    options: [
      "Только валидный номер",
      "Только пустое значение",
      "Валидные, невалидные и граничные значения",
      "Только длинные номера",
    ],
    correctIndex: 2,
  },
  {
    track: "QA",
    text: "Что означает status code 401?",
    options: ["Unauthorized", "Not Found", "Bad Gateway", "Success"],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Что чаще всего проверяют в accessibility testing?",
    options: [
      "Доступность интерфейса для пользователей с ограничениями",
      "Скорость API",
      "SQL-инъекции",
      "Архитектуру базы данных",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Что такое retest?",
    options: [
      "Проверка нового функционала",
      "Повторная проверка конкретного исправленного дефекта",
      "Проверка UI-анимаций",
      "Проверка серверных логов",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Какой риск есть при тестировании только happy path?",
    options: [
      "Повышение стабильности",
      "Пропуск проблем в негативных сценариях",
      "Ускорение backend",
      "Уменьшение количества багов",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что чаще всего используется для хранения bug reports?",
    options: ["IDE", "Bug tracking system", "VPN", "Git hooks"],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что такое test environment?",
    options: [
      "Окружение для выполнения тестов",
      "Название браузера",
      "Тип устройства",
      "Только сервер",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: 'Что полезно проверить при тестировании кнопки "Отправить"?',
    options: [
      "Реакцию на двойное нажатие",
      "Только цвет кнопки",
      "Только наличие текста",
      "Только размер иконки",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Какой формат данных чаще всего используется в REST API?",
    options: ["XML only", "CSV", "JSON", "TXT"],
    correctIndex: 2,
  },
  {
    track: "QA",
    text: "Что такое exploratory testing?",
    options: [
      "Проверка только по документации",
      "Свободное исследовательское тестирование",
      "Автоматическое тестирование",
      "Нагрузочное тестирование",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что из перечисленного относится к usability проблеме?",
    options: [
      "Кнопка расположена неочевидно для пользователя",
      "API возвращает 500",
      "SQL syntax error",
      "NullPointerException",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Что важно указать в bug report кроме шагов?",
    options: [
      "Любимый браузер тестировщика",
      "Actual и Expected result",
      "Цвет темы IDE",
      "Название Wi-Fi сети",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что такое authentication?",
    options: [
      "Проверка прав доступа",
      "Проверка личности пользователя",
      "Проверка скорости API",
      "Проверка верстки",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что такое authorization?",
    options: [
      "Проверка личности пользователя",
      "Выдача прав доступа после входа",
      "Проверка SSL",
      "Проверка response time",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Какой тип тестирования проверяет скорость работы системы под нагрузкой?",
    options: ["Smoke", "Performance", "UI", "Sanity"],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что является хорошей практикой для expected result?",
    options: [
      '"Все должно работать"',
      "Максимально конкретное описание результата",
      "Короткий комментарий без деталей",
      "Повторение шага теста",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что может быть признаком backend-проблемы?",
    options: [
      "Неверный HTTP response",
      "Сдвиг кнопки на 1px",
      "Неровный padding",
      "Опечатка в тексте",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Что такое boundary value analysis?",
    options: [
      "Анализ производительности",
      "Проверка значений на границах диапазонов",
      "Проверка UI",
      "Проверка SQL-индексов",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что важно проверить при тестировании формы регистрации?",
    options: [
      "Обработку дубликатов email",
      "Только цвет кнопки",
      "Только favicon",
      "Только hover-эффекты",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Что чаще всего используется для хранения API коллекций?",
    options: ["Excel", "Postman", "Photoshop", "Jenkins"],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что такое sanity testing?",
    options: [
      "Полное тестирование системы",
      "Быстрая проверка конкретного изменения",
      "Нагрузочное тестирование",
      "Проверка безопасности",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что такое selector в UI-автоматизации?",
    options: [
      "Тип базы данных",
      "Способ найти элемент интерфейса",
      "HTTP-заголовок",
      "SQL-команда",
    ],
    correctIndex: 1,
  },
  {
    track: "QA",
    text: "Что может быть хорошим источником expected result для расчётов?",
    options: [
      "Формула или бизнес-логика",
      "Цвет UI",
      "Комментарий дизайнера",
      "Название браузера",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Что полезно проверить при тестировании загрузки файла?",
    options: [
      "Ограничение размера и формата",
      "Только цвет кнопки",
      "Только название страницы",
      "Только favicon",
    ],
    correctIndex: 0,
  },
  {
    track: "QA",
    text: "Что наиболее важно для QA Intern на собеседовании?",
    options: [
      "Знание всех HTTP-кодов наизусть",
      "Умение логически рассуждать и объяснять проверки",
      "Идеальное знание XPath",
      "Опыт DevOps",
    ],
    correctIndex: 1,
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

const sampleSqlQuestions = [
  {
    track: "QA",
    text: "Выведите имена сотрудников и их отделы для всех, кто владеет навыком SQL. Результат отсортируйте по имени.",
    explanation:
      "Проверяется умение соединять связанные таблицы и фильтровать данные по значению навыка.",
    apiConfig: {
      mode: "SQL_SANDBOX" as const,
      taskTitle: "Сотрудники, владеющие SQL",
      mission:
        "Выведите имена сотрудников и их отделы для всех, кто владеет навыком SQL. Результат отсортируйте по имени. В результирующей таблице должны быть поля full_name и department.",
      dialect: "SQLite",
      tables: [
        {
          name: "Employee",
          columns: [
            { name: "id", type: "INTEGER" as const },
            { name: "full_name", type: "TEXT" as const },
            { name: "position", type: "TEXT" as const },
            { name: "department", type: "TEXT" as const },
          ],
          rows: [
            {
              id: 1,
              full_name: "Alekseev Aleksey",
              position: "Developer",
              department: "IT",
            },
            {
              id: 2,
              full_name: "Borisova Mariya",
              position: "Analyst",
              department: "Analytics",
            },
            {
              id: 3,
              full_name: "Volkov Dmitriy",
              position: "QA Engineer",
              department: "IT",
            },
            {
              id: 4,
              full_name: "Grigoreva Olga",
              position: "Manager",
              department: "Sales",
            },
            {
              id: 5,
              full_name: "Denisov Pavel",
              position: "DevOps",
              department: "IT",
            },
          ],
        },
        {
          name: "Skill",
          columns: [
            { name: "id", type: "INTEGER" as const },
            { name: "name", type: "TEXT" as const },
          ],
          rows: [
            { id: 1, name: "SQL" },
            { id: 2, name: "Python" },
            { id: 3, name: "Java" },
            { id: 4, name: "Docker" },
            { id: 5, name: "Excel" },
            { id: 6, name: "Project Management" },
            { id: 7, name: "Client Communication" },
          ],
        },
        {
          name: "EmployeeSkill",
          columns: [
            { name: "employee_id", type: "INTEGER" as const },
            { name: "skill_id", type: "INTEGER" as const },
            { name: "level", type: "TEXT" as const },
          ],
          rows: [
            { employee_id: 1, skill_id: 1, level: "Expert" },
            { employee_id: 1, skill_id: 2, level: "Intermediate" },
            { employee_id: 1, skill_id: 4, level: "Beginner" },
            { employee_id: 2, skill_id: 1, level: "Intermediate" },
            { employee_id: 2, skill_id: 5, level: "Expert" },
            { employee_id: 2, skill_id: 6, level: "Intermediate" },
            { employee_id: 3, skill_id: 3, level: "Intermediate" },
            { employee_id: 3, skill_id: 1, level: "Beginner" },
            { employee_id: 4, skill_id: 6, level: "Expert" },
            { employee_id: 4, skill_id: 7, level: "Expert" },
          ],
        },
      ],
      expectedResult: {
        columns: ["full_name", "department"],
        rows: [
          ["Alekseev Aleksey", "IT"],
          ["Borisova Mariya", "Analytics"],
          ["Volkov Dmitriy", "IT"],
        ],
      },
    },
  },
  {
    track: "QA",
    text: "Выведите имена всех студентов, которые изучают предмет «Математика». Результат отсортируйте по имени.",
    explanation:
      "Проверяется умение соединять связанные таблицы и фильтровать данные по значению предмета.",
    apiConfig: {
      mode: "SQL_SANDBOX" as const,
      taskTitle: "Студенты, изучающие математику",
      mission:
        "Выведите имена всех студентов, которые изучают предмет «Математика». Результат отсортируйте по имени. В результирующей таблице должно быть поле name.",
      dialect: "SQLite",
      tables: [
        {
          name: "Student",
          columns: [
            { name: "id", type: "INTEGER" as const },
            { name: "name", type: "TEXT" as const },
            { name: "group_name", type: "TEXT" as const },
          ],
          rows: [
            { id: 1, name: "Алиев Али", group_name: "Группа А" },
            { id: 2, name: "Батыров Тимур", group_name: "Группа Б" },
            { id: 3, name: "Валеева Динара", group_name: "Группа А" },
            { id: 4, name: "Ганиев Руслан", group_name: "Группа Б" },
          ],
        },
        {
          name: "Subject",
          columns: [
            { name: "id", type: "INTEGER" as const },
            { name: "title", type: "TEXT" as const },
          ],
          rows: [
            { id: 1, title: "Математика" },
            { id: 2, title: "Физика" },
            { id: 3, title: "История" },
          ],
        },
        {
          name: "StudentSubject",
          columns: [
            { name: "student_id", type: "INTEGER" as const },
            { name: "subject_id", type: "INTEGER" as const },
          ],
          rows: [
            { student_id: 1, subject_id: 1 },
            { student_id: 1, subject_id: 2 },
            { student_id: 2, subject_id: 1 },
            { student_id: 3, subject_id: 3 },
            { student_id: 4, subject_id: 1 },
            { student_id: 4, subject_id: 2 },
          ],
        },
      ],
      expectedResult: {
        columns: ["name"],
        rows: [["Алиев Али"], ["Батыров Тимур"], ["Ганиев Руслан"]],
      },
    },
  },
  {
    track: "QA",
    text: "Выведите названия всех товаров, которые купил клиент «ООО Стройка». Результат отсортируйте по названию товара.",
    explanation:
      "Проверяется умение соединять таблицы клиентов, товаров и покупок через связующую таблицу.",
    apiConfig: {
      mode: "SQL_SANDBOX" as const,
      taskTitle: "Товары клиента ООО Стройка",
      mission:
        "Выведите названия всех товаров, которые купил клиент «ООО Стройка». Результат отсортируйте по названию товара. В результирующей таблице должно быть поле product_name.",
      dialect: "SQLite",
      tables: [
        {
          name: "Client",
          columns: [
            { name: "id", type: "INTEGER" as const },
            { name: "company_name", type: "TEXT" as const },
            { name: "city", type: "TEXT" as const },
          ],
          rows: [
            { id: 1, company_name: "ООО Стройка", city: "Ташкент" },
            { id: 2, company_name: "ИП Азизов", city: "Самарканд" },
            { id: 3, company_name: "ООО Мебель", city: "Ташкент" },
            { id: 4, company_name: "АО Техника", city: "Бухара" },
          ],
        },
        {
          name: "Product",
          columns: [
            { name: "id", type: "INTEGER" as const },
            { name: "product_name", type: "TEXT" as const },
            { name: "price", type: "INTEGER" as const },
          ],
          rows: [
            { id: 1, product_name: "Гвозди 100мм", price: 500 },
            { id: 2, product_name: "Молоток", price: 1500 },
            { id: 3, product_name: "Шуруп 50мм", price: 300 },
            { id: 4, product_name: "Дрель", price: 12000 },
            { id: 5, product_name: "Рулетка", price: 800 },
          ],
        },
        {
          name: "Purchase",
          columns: [
            { name: "client_id", type: "INTEGER" as const },
            { name: "product_id", type: "INTEGER" as const },
            { name: "quantity", type: "INTEGER" as const },
          ],
          rows: [
            { client_id: 1, product_id: 1, quantity: 100 },
            { client_id: 1, product_id: 2, quantity: 5 },
            { client_id: 1, product_id: 3, quantity: 200 },
            { client_id: 2, product_id: 2, quantity: 3 },
            { client_id: 2, product_id: 5, quantity: 10 },
            { client_id: 3, product_id: 4, quantity: 2 },
            { client_id: 4, product_id: 1, quantity: 50 },
            { client_id: 4, product_id: 2, quantity: 7 },
          ],
        },
      ],
      expectedResult: {
        columns: ["product_name"],
        rows: [["Гвозди 100мм"], ["Молоток"], ["Шуруп 50мм"]],
      },
    },
  },
  {
    track: "QA",
    text: "Выведите имена всех сотрудников, которые работают в отделе «ИТ». Отсортируйте по имени.",
    explanation:
      "Проверяется умение соединять таблицы сотрудников и отделов и фильтровать записи по названию отдела.",
    apiConfig: {
      mode: "SQL_SANDBOX" as const,
      taskTitle: "Сотрудники отдела ИТ",
      mission:
        "Выведите имена всех сотрудников, которые работают в отделе «ИТ». Отсортируйте по имени. В результирующей таблице должно быть поле name.",
      dialect: "SQLite",
      tables: [
        {
          name: "Department",
          columns: [
            { name: "id", type: "INTEGER" as const },
            { name: "name", type: "TEXT" as const },
          ],
          rows: [
            { id: 1, name: "ИТ" },
            { id: 2, name: "Продажи" },
            { id: 3, name: "Бухгалтерия" },
          ],
        },
        {
          name: "Employee",
          columns: [
            { name: "id", type: "INTEGER" as const },
            { name: "name", type: "TEXT" as const },
            { name: "department_id", type: "INTEGER" as const },
          ],
          rows: [
            { id: 1, name: "Алексеев Алексей", department_id: 1 },
            { id: 2, name: "Борисова Мария", department_id: 2 },
            { id: 3, name: "Волков Дмитрий", department_id: 1 },
            { id: 4, name: "Григорьева Ольга", department_id: 2 },
            { id: 5, name: "Денисов Павел", department_id: 3 },
            { id: 6, name: "Егорова Анна", department_id: 1 },
          ],
        },
      ],
      expectedResult: {
        columns: ["name"],
        rows: [["Алексеев Алексей"], ["Волков Дмитрий"], ["Егорова Анна"]],
      },
    },
  },
];

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
  if (count === 0) {
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
  }

  async function ensurePresetQuestion(input: {
    type: "API_SANDBOX" | "SQL_SANDBOX";
    track: string;
    text: string;
    explanation: string;
    apiConfig: object;
  }) {
    const existing = await prisma.question.findFirst({
      where: {
        type: input.type,
        text: input.text,
      },
      select: { id: true },
    });

    if (existing) return;

    const { _max } = await prisma.question.aggregate({
      _max: { order: true },
    });

    await prisma.question.create({
      data: {
        type: input.type,
        text: input.text,
        track: input.track,
        trackId: tracks.get(input.track)?.id,
        explanation: input.explanation,
        order: (_max.order ?? 0) + 1,
        apiConfig: input.apiConfig,
      },
    });
  }

  await ensurePresetQuestion({
    type: "API_SANDBOX",
    text: sampleApiQuestion.text,
    track: sampleApiQuestion.track,
    explanation: sampleApiQuestion.explanation,
    apiConfig: sampleApiQuestion.apiConfig,
  });

  for (const sampleSqlQuestion of sampleSqlQuestions) {
    await ensurePresetQuestion({
      type: "SQL_SANDBOX",
      text: sampleSqlQuestion.text,
      track: sampleSqlQuestion.track,
      explanation: sampleSqlQuestion.explanation,
      apiConfig: sampleSqlQuestion.apiConfig,
    });
  }
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
