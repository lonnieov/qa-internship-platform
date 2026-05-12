import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim();
}

function withoutInternalPort(host: string, protocol: string, internalPort: string) {
  if (protocol === "https:" && host.endsWith(":443")) {
    return host.slice(0, -4);
  }

  if (protocol === "http:" && host.endsWith(":80")) {
    return host.slice(0, -3);
  }

  if (internalPort && host.endsWith(`:${internalPort}`)) {
    return host.slice(0, -(internalPort.length + 1));
  }

  return host;
}

function portFromHost(host: string) {
  return host.match(/:(\d+)$/)?.[1] ?? "";
}

function normalizeSameOriginRedirect(request: NextRequest, location: string) {
  const redirectUrl = new URL(location, request.url);
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const requestHost = request.headers.get("host") ?? request.nextUrl.host;
  const externalForwardedHost =
    forwardedHost && forwardedHost !== requestHost ? forwardedHost : null;
  const currentHost = externalForwardedHost ?? requestHost;
  const currentHostname = currentHost.split(":")[0];

  if (
    redirectUrl.hostname === request.nextUrl.hostname ||
    redirectUrl.hostname === currentHostname
  ) {
    const publicProtocol = forwardedProto ? `${forwardedProto}:` : request.nextUrl.protocol;
    const protocolChanged = Boolean(
      forwardedProto && publicProtocol !== request.nextUrl.protocol,
    );
    const hostPort = portFromHost(currentHost);
    const usesHttpsWithRuntimePort = Boolean(
      forwardedProto === "https" && hostPort && hostPort !== "443",
    );
    const runtimePort =
      externalForwardedHost || protocolChanged || usesHttpsWithRuntimePort
        ? redirectUrl.port || request.nextUrl.port || hostPort
        : "";
    const publicHost = withoutInternalPort(currentHost, publicProtocol, runtimePort);

    return `${publicProtocol}//${publicHost}${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
  }

  return location;
}

export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);
  const location = response.headers.get("location");

  if (location) {
    response.headers.set("location", normalizeSameOriginRedirect(request, location));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
