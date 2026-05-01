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

function escapeSqlValue(value: SqlScalar) {
  if (value === null || typeof value === "undefined") return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function runSqliteScript(databasePath: string, script: string) {
  const { spawn } = await import("node:child_process");
  return await new Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }>((resolve, reject) => {
    const child = spawn("/usr/bin/sqlite3", [databasePath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 });
    });

    child.stdin.write(script);
    child.stdin.end();
  });
}

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

export function getSqlSandboxConfig(
  value: unknown,
): SqlSandboxConfig | null {
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

function compareResult(
  actual: SqlSandboxExecutionResult,
  expected: SqlSandboxExpectedResult,
) {
  if (actual.columns.length !== expected.columns.length) return false;

  const normalizeColumn = (value: string) => value.trim().toLowerCase();
  const expectedColumns = expected.columns.map(normalizeColumn);
  const actualColumns = actual.columns.map(normalizeColumn);

  const actualIndexByColumn = new Map(
    actualColumns.map((column, index) => [column, index]),
  );

  if (
    expectedColumns.some((column) => !actualIndexByColumn.has(column)) ||
    actualColumns.some((column) => !expectedColumns.includes(column))
  ) {
    return false;
  }

  const normalizeCell = (value: SqlScalar) =>
    value === null ? "null" : String(value).trim();

  const serializeRow = (row: SqlScalar[], columns: string[]) =>
    expectedColumns
      .map((column) => {
        const columnIndex = columns.indexOf(column);
        return normalizeCell(columnIndex >= 0 ? row[columnIndex] ?? null : null);
      })
      .join("\u001f");

  const actualRows = actual.rows
    .map((row) => serializeRow(row, actualColumns))
    .sort();
  const expectedRows = expected.rows
    .map((row) => serializeRow(row, expectedColumns))
    .sort();

  if (actualRows.length !== expectedRows.length) return false;

  return actualRows.every((row, index) => row === expectedRows[index]);
}

async function validateSqlSandboxQuery(
  config: SqlSandboxConfig,
  query: string,
) {
  try {
    const { Parser } = await import("node-sql-parser");
    const sqlParser = new Parser();
    const options = { database: "sqlite" as const };
    const ast = sqlParser.astify(query, options);
    const statements = Array.isArray(ast) ? ast : [ast];

    if (statements.length !== 1) {
      return "Разрешён только один SQL-запрос за запуск.";
    }

    const statement = statements[0];
    if (!statement || statement.type !== "select") {
      return "Разрешены только SELECT- и WITH-запросы.";
    }

    const allowedTables = new Set(config.tables.map((table) => table.name));
    const usedTables = sqlParser.tableList(query, options)
      .map((entry) => entry.split("::").at(-1) ?? "")
      .filter(Boolean);

    const disallowedTable = usedTables.find((table) => !allowedTables.has(table));
    if (disallowedTable) {
      return `В запросе используется таблица ${disallowedTable}, которой нет в задании.`;
    }

    return null;
  } catch (error) {
    if (error instanceof Error && error.message.trim()) {
      return `Некорректный SQL: ${error.message}`;
    }

    return "Некорректный SQL-запрос.";
  }
}

export async function executeSqlSandboxQuery(
  config: SqlSandboxConfig,
  query: string,
) {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      ok: false,
      columns: [],
      rows: [],
      error: "Введите SQL-запрос.",
    } satisfies SqlSandboxExecutionResult;
  }

  const statementText = trimmed.replace(/;\s*$/, "");
  if (!/^(select|with)\b/i.test(statementText)) {
    return {
      ok: false,
      columns: [],
      rows: [],
      error: "Разрешены только SELECT- и WITH-запросы.",
    } satisfies SqlSandboxExecutionResult;
  }

  const validationError = await validateSqlSandboxQuery(config, statementText);
  if (validationError) {
    return {
      ok: false,
      columns: [],
      rows: [],
      error: validationError,
    } satisfies SqlSandboxExecutionResult;
  }

  try {
    const [{ mkdtemp, rm }, { tmpdir }, { join }] = await Promise.all([
      import("node:fs/promises"),
      import("node:os"),
      import("node:path"),
    ]);
    const tempDir = await mkdtemp(join(tmpdir(), "qa-sql-sandbox-"));
    const databasePath = join(tempDir, "sandbox.sqlite");
    const setupStatements: string[] = [];

    for (const table of config.tables) {
      const columnSql = table.columns
        .map((column) => `"${column.name}" ${column.type}`)
        .join(", ");
      setupStatements.push(`CREATE TABLE "${table.name}" (${columnSql});`);

      for (const row of table.rows) {
        const columns = table.columns.map((column) => column.name);
        const valuesSql = columns
          .map((column) => escapeSqlValue(row[column]))
          .join(", ");
        setupStatements.push(
          `INSERT INTO "${table.name}" (${columns.map((column) => `"${column}"`).join(", ")}) VALUES (${valuesSql});`,
        );
      }
    }

    const script = [
      ".mode json",
      ...setupStatements,
      `${statementText};`,
    ].join("\n");

    const execution = await runSqliteScript(databasePath, script);
    await rm(tempDir, { recursive: true, force: true });

    if (execution.exitCode !== 0) {
      return {
        ok: false,
        columns: [],
        rows: [],
        error: execution.stderr.trim() || "SQL execution failed.",
      } satisfies SqlSandboxExecutionResult;
    }

    const rowsObject = execution.stdout.trim()
      ? (JSON.parse(execution.stdout) as Array<Record<string, unknown>>)
      : [];
    const columns = Object.keys(rowsObject[0] ?? {});
    const rows = rowsObject.map((row) =>
      columns.map((column) => normalizeScalar(row[column])),
    );
    const result = {
      ok: compareResult(
        {
          ok: true,
          columns,
          rows,
        },
        config.expectedResult,
      ),
      columns,
      rows,
    } satisfies SqlSandboxExecutionResult;

    return result;
  } catch (error) {
    return {
      ok: false,
      columns: [],
      rows: [],
      error: error instanceof Error ? error.message : "SQL execution failed.",
    } satisfies SqlSandboxExecutionResult;
  }
}
