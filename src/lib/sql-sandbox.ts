import "server-only";

import {
  type SqlSandboxConfig,
  type SqlSandboxExecutionResult,
  type SqlSandboxExpectedResult,
  sampleSqlSandboxConfig,
} from "@/lib/sql-sandbox-config";

type SqlScalar = string | number | null;

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

function normalizeScalar(value: unknown): SqlScalar {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (value === null || typeof value === "undefined") {
    return null;
  }
  return String(value);
}

export { sampleSqlSandboxConfig };

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

    const script = [".mode json", ...setupStatements, `${statementText};`].join(
      "\n",
    );

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

    return {
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
  } catch (error) {
    return {
      ok: false,
      columns: [],
      rows: [],
      error: error instanceof Error ? error.message : "SQL execution failed.",
    } satisfies SqlSandboxExecutionResult;
  }
}
