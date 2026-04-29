type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type ApiSandboxConfig = {
  mode?: "MANUAL_REQUEST" | "DEVTOOLS_RESPONSE";
  method: string;
  path: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: JsonValue;
  successStatus?: number;
  successHeaders?: Record<string, string>;
  successBody?: JsonValue;
  buttonLabel?: string;
  answerLabel?: string;
  answerPath?: string;
  expectedAnswer?: string;
};

export type ApiSandboxRequest = {
  method: string;
  url: string;
  headersText?: string;
  bodyText?: string;
};

export type ApiSandboxEvaluation = {
  ok: boolean;
  response: {
    status: number;
    headers: Record<string, string>;
    body: JsonValue;
  };
  normalizedRequest: {
    method: string;
    path: string;
    query: Record<string, string>;
    headers: Record<string, string>;
    body: JsonValue | null;
  };
  errorCode?: string;
};

function asStringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, String(item)]),
  );
}

function normalizeMethod(method: string) {
  return method.trim().toUpperCase();
}

function normalizePath(path: string) {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function parseUrlParts(url: string) {
  const normalizedUrl = url.trim().startsWith("http")
    ? url.trim()
    : `https://sandbox.local${url.trim().startsWith("/") ? "" : "/"}${url.trim()}`;
  const parsed = new URL(normalizedUrl);

  return {
    path: normalizePath(parsed.pathname),
    query: parseQueryString(parsed.search),
  };
}

export function parseHeaderLines(text: string | undefined) {
  const headers: Record<string, string> = {};

  for (const rawLine of (text ?? "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error(`Invalid header line: ${line}`);
    }

    const name = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();

    if (!name || !value) {
      throw new Error(`Invalid header line: ${line}`);
    }

    headers[name] = value;
  }

  return headers;
}

export function parseQueryString(input: string | undefined) {
  const query: Record<string, string> = {};
  const search = (input ?? "").trim();
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);

  params.forEach((value, key) => {
    query[key] = value;
  });

  return query;
}

function tryParseJson(text: string | undefined) {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return null;
  return JSON.parse(trimmed) as JsonValue;
}

function equalJson(left: JsonValue, right: JsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function equalRecord(left: Record<string, string>, right: Record<string, string>) {
  const leftEntries = Object.entries(left).sort(([a], [b]) => a.localeCompare(b));
  const rightEntries = Object.entries(right).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(leftEntries) === JSON.stringify(rightEntries);
}

function response(status: number, body: JsonValue, headers?: Record<string, string>) {
  return {
    status,
    headers: headers ?? { "content-type": "application/json" },
    body,
  };
}

export function parseApiSandboxConfig(input: string) {
  return JSON.parse(input) as ApiSandboxConfig;
}

export function normalizeApiSandboxConfig(input: unknown): ApiSandboxConfig {
  const raw =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};

  return {
    mode: raw.mode === "DEVTOOLS_RESPONSE" ? "DEVTOOLS_RESPONSE" : "MANUAL_REQUEST",
    method: String(raw.method ?? "GET"),
    path: String(raw.path ?? "/"),
    query: asStringRecord(raw.query),
    headers: asStringRecord(raw.headers),
    body: raw.body as JsonValue | undefined,
    successStatus:
      typeof raw.successStatus === "number" ? raw.successStatus : Number(raw.successStatus ?? 200),
    successHeaders: asStringRecord(raw.successHeaders),
    successBody:
      typeof raw.successBody === "undefined" ? ({ ok: true } as JsonValue) : (raw.successBody as JsonValue),
    buttonLabel: String(raw.buttonLabel ?? "Отправить запрос"),
    answerLabel: String(raw.answerLabel ?? "Введите значение из response"),
    answerPath:
      typeof raw.answerPath === "string" && raw.answerPath.trim()
        ? raw.answerPath.trim()
        : undefined,
    expectedAnswer:
      typeof raw.expectedAnswer === "undefined" ? undefined : String(raw.expectedAnswer),
  };
}

export function getJsonPathValue(input: JsonValue | undefined, path: string | undefined) {
  if (!path) return undefined;

  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || typeof current === "undefined") return undefined;

    const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      const container =
        typeof current === "object" && !Array.isArray(current)
          ? (current as Record<string, unknown>)[key]
          : undefined;
      return Array.isArray(container) ? container[Number(index)] : undefined;
    }

    if (Array.isArray(current) && /^\d+$/.test(segment)) {
      return current[Number(segment)];
    }

    if (typeof current === "object" && !Array.isArray(current)) {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, input);
}

export function normalizeAnswerValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  if (typeof value === "undefined") return "";
  return JSON.stringify(value);
}

export function evaluateApiSandboxRequest(
  configInput: ApiSandboxConfig | unknown,
  request: ApiSandboxRequest,
): ApiSandboxEvaluation {
  const config = normalizeApiSandboxConfig(configInput);
  const method = normalizeMethod(request.method);
  const expectedMethod = normalizeMethod(config.method);
  const expectedPath = normalizePath(config.path);
  const expectedQuery = config.query ?? {};
  const expectedHeaders = Object.fromEntries(
    Object.entries(config.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]),
  );

  let parsedBody: JsonValue | null = null;
  let parsedPath = "/";
  let parsedQuery: Record<string, string> = {};
  let parsedHeaders: Record<string, string> = {};

  try {
    const urlParts = parseUrlParts(request.url);
    parsedPath = urlParts.path;
    parsedQuery = urlParts.query;
    parsedHeaders = parseHeaderLines(request.headersText);
    parsedBody = tryParseJson(request.bodyText);
  } catch (error) {
    return {
      ok: false,
      errorCode: "INVALID_REQUEST_FORMAT",
      normalizedRequest: {
        method,
        path: parsedPath,
        query: parsedQuery,
        headers: parsedHeaders,
        body: parsedBody,
      },
      response: response(400, {
        error: "invalid_request_format",
        message: error instanceof Error ? error.message : "Request parsing failed.",
      }),
    };
  }

  const normalizedRequest = {
    method,
    path: parsedPath,
    query: parsedQuery,
    headers: parsedHeaders,
    body: parsedBody,
  };

  if (parsedPath !== expectedPath) {
    return {
      ok: false,
      errorCode: "PATH_MISMATCH",
      normalizedRequest,
      response: response(404, {
        error: "not_found",
        message: `Endpoint ${parsedPath} не существует.`,
      }),
    };
  }

  if (method !== expectedMethod) {
    return {
      ok: false,
      errorCode: "METHOD_MISMATCH",
      normalizedRequest,
      response: response(405, {
        error: "method_not_allowed",
        message: `Для ${expectedPath} нужен метод ${expectedMethod}.`,
      }),
      };
  }

  for (const [name, value] of Object.entries(expectedHeaders)) {
    if (parsedHeaders[name] !== value) {
      return {
        ok: false,
        errorCode: name === "authorization" ? "AUTH_MISMATCH" : "HEADER_MISMATCH",
        normalizedRequest,
        response: response(name === "authorization" ? 401 : 400, {
          error: name === "authorization" ? "unauthorized" : "invalid_headers",
          message:
            name === "authorization"
              ? "Не передан корректный Authorization header."
              : `Header ${name} имеет неверное значение.`,
        }),
      };
    }
  }

  if (!equalRecord(parsedQuery, expectedQuery)) {
    return {
      ok: false,
      errorCode: "QUERY_MISMATCH",
      normalizedRequest,
      response: response(400, {
        error: "invalid_query",
        message: "Query parameters не совпадают с ожидаемыми.",
        expected: expectedQuery,
      }),
    };
  }

  if (typeof config.body !== "undefined" && !equalJson(parsedBody, config.body)) {
    return {
      ok: false,
      errorCode: "BODY_MISMATCH",
      normalizedRequest,
      response: response(400, {
        error: "invalid_body",
        message: "JSON body не совпадает с ожидаемым.",
      }),
    };
  }

  return {
    ok: true,
    normalizedRequest,
    response: response(
      config.successStatus ?? 200,
      config.successBody ?? { ok: true },
      config.successHeaders,
    ),
  };
}

export function stringifyPrettyJson(value: unknown) {
  if (typeof value === "undefined") return "";
  return JSON.stringify(value, null, 2);
}
