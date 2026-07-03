"use client";

import { useEffect } from "react";
import { hashRouteToPath, toHashRoute } from "@/lib/hash-routing";

let isShowingHashRoute = false;

function currentPathWithSearch() {
  return `${window.location.pathname}${window.location.search}`;
}

function pathWithoutFragment(path: string) {
  return path.split("#")[0] || "/";
}

function isRouteHash(hash: string) {
  return Boolean(hashRouteToPath(hash));
}

function showHashRoute() {
  if (window.location.hash && !isRouteHash(window.location.hash)) {
    return;
  }

  const current = currentPathWithSearch();
  const next = toHashRoute(current);

  if (
    next !== current &&
    `${window.location.pathname}${window.location.hash}` !== next
  ) {
    isShowingHashRoute = true;
    window.history.replaceState(window.history.state, "", next);
    isShowingHashRoute = false;
  }
}

function syncHashRoute() {
  const target = hashRouteToPath(window.location.hash);

  if (!target) {
    showHashRoute();
    return;
  }

  if (pathWithoutFragment(target) === currentPathWithSearch()) {
    showHashRoute();
    return;
  }

  window.location.replace(target);
}

export function HashRouteBridge() {
  useEffect(() => {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(
      window.history,
    );
    const scheduleSync = () => {
      if (!isShowingHashRoute) {
        window.requestAnimationFrame(syncHashRoute);
      }
    };

    window.history.pushState = ((...args: Parameters<History["pushState"]>) => {
      const result = originalPushState(...args);
      scheduleSync();
      return result;
    }) as History["pushState"];
    window.history.replaceState = ((
      ...args: Parameters<History["replaceState"]>
    ) => {
      const result = originalReplaceState(...args);
      scheduleSync();
      return result;
    }) as History["replaceState"];

    syncHashRoute();
    window.addEventListener("hashchange", syncHashRoute);
    window.addEventListener("popstate", syncHashRoute);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("hashchange", syncHashRoute);
      window.removeEventListener("popstate", syncHashRoute);
    };
  }, []);

  return null;
}
