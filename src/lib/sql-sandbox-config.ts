type SqlScalar = string | number | null;

export type SqlSandboxTableColumn = {
  name: string;
  type: "INTEGER" | "REAL" | "TEXT";
};

export type SqlSandboxTable = {
  name: string;
  columns: SqlSandboxTableColumn[];
  rows: Array<Record<string, SqlScalar>>;
};

export type SqlSandboxExpectedResult = {
  columns: string[];
  rows: SqlScalar[][];
};

export type SqlSandboxConfig = {
  mode: "SQL_SANDBOX";
  taskTitle: string;
  mission: string;
  dialect: string;
  tables: SqlSandboxTable[];
  expectedResult: SqlSandboxExpectedResult;
};

export type SqlSandboxExecutionResult = {
  ok: boolean;
  columns: string[];
  rows: SqlScalar[][];
  error?: string;
};

export const sampleSqlSandboxConfig: SqlSandboxConfig = {
  mode: "SQL_SANDBOX",
  taskTitle: "Сотрудники, владеющие SQL",
  mission:
    "Выведите имена сотрудников и их отделы для всех, кто владеет навыком SQL. В результирующей таблице должны быть поля full_name и department.",
  dialect: "SQLite",
  tables: [
    {
      name: "Employee",
      columns: [
        { name: "id", type: "INTEGER" },
        { name: "full_name", type: "TEXT" },
        { name: "position", type: "TEXT" },
        { name: "department", type: "TEXT" },
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
        { name: "id", type: "INTEGER" },
        { name: "name", type: "TEXT" },
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
        { name: "employee_id", type: "INTEGER" },
        { name: "skill_id", type: "INTEGER" },
        { name: "level", type: "TEXT" },
      ],
      rows: [
        {
          employee_id: 1,
          skill_id: 1,
          level: "Expert",
        },
        {
          employee_id: 1,
          skill_id: 2,
          level: "Intermediate",
        },
        {
          employee_id: 1,
          skill_id: 4,
          level: "Beginner",
        },
        {
          employee_id: 2,
          skill_id: 1,
          level: "Intermediate",
        },
        {
          employee_id: 2,
          skill_id: 5,
          level: "Expert",
        },
        {
          employee_id: 2,
          skill_id: 6,
          level: "Intermediate",
        },
        {
          employee_id: 3,
          skill_id: 3,
          level: "Intermediate",
        },
        {
          employee_id: 3,
          skill_id: 1,
          level: "Beginner",
        },
        {
          employee_id: 4,
          skill_id: 6,
          level: "Expert",
        },
        {
          employee_id: 4,
          skill_id: 7,
          level: "Expert",
        },
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
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeScalar(value: unknown): SqlScalar {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (value === null || typeof value === "undefined") {
    return null;
  }
  return String(value);
}

function sanitizeIdentifier(value: string) {
  const trimmed = value.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
    throw new Error(`Invalid SQL identifier: ${value}`);
  }
  return trimmed;
}

export function getSqlSandboxConfig(value: unknown): SqlSandboxConfig | null {
  if (!isRecord(value) || value.mode !== "SQL_SANDBOX") {
    return null;
  }

  const tables = Array.isArray(value.tables)
    ? value.tables
        .filter(isRecord)
        .map((table) => {
          const columns = Array.isArray(table.columns)
            ? table.columns
                .filter(isRecord)
                .map((column) => {
                  const type =
                    column.type === "INTEGER" ||
                    column.type === "REAL" ||
                    column.type === "TEXT"
                      ? column.type
                      : "TEXT";

                  return {
                    name: sanitizeIdentifier(String(column.name ?? "")),
                    type,
                  } satisfies SqlSandboxTableColumn;
                })
            : [];

          return {
            name: sanitizeIdentifier(String(table.name ?? "")),
            columns,
            rows: Array.isArray(table.rows)
              ? table.rows
                  .filter(isRecord)
                  .map((row) =>
                    Object.fromEntries(
                      columns.map((column) => [
                        column.name,
                        normalizeScalar(row[column.name]),
                      ]),
                    ),
                  )
              : [],
          } satisfies SqlSandboxTable;
        })
        .filter((table) => table.columns.length > 0)
    : sampleSqlSandboxConfig.tables;

  const expectedRecord = isRecord(value.expectedResult)
    ? value.expectedResult
    : sampleSqlSandboxConfig.expectedResult;

  return {
    mode: "SQL_SANDBOX" as const,
    taskTitle:
      String(value.taskTitle ?? "").trim() || sampleSqlSandboxConfig.taskTitle,
    mission:
      String(value.mission ?? "").trim() || sampleSqlSandboxConfig.mission,
    dialect: String(value.dialect ?? "").trim() || "SQLite",
    tables: tables.length > 0 ? tables : sampleSqlSandboxConfig.tables,
    expectedResult: {
      columns: Array.isArray(expectedRecord.columns)
        ? expectedRecord.columns.map((column) => String(column))
        : sampleSqlSandboxConfig.expectedResult.columns,
      rows: Array.isArray(expectedRecord.rows)
        ? expectedRecord.rows.map((row) =>
            Array.isArray(row) ? row.map(normalizeScalar) : [],
          )
        : sampleSqlSandboxConfig.expectedResult.rows,
    },
  } satisfies SqlSandboxConfig;
}
