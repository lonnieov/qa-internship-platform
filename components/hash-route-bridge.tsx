"use client";

import { useEffect } from "react";
import { hashRouteToPath, toHashRoute } from "@/lib/hash-routing";

let isShowingHashRoute = false;
// The real path we last mirrored into the hash ourselves. Used to tell an
// echo of our own mirror apart from a genuine incoming hash navigation.
let mirroredFromPath: string | null = null;

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
    mirroredFromPath = current;
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

  // The hash route is just an echo of what we mirrored — we are already on
  // that page, so do not hard-navigate (that would reload forever under
  // routers that re-invoke history.replaceState after mount).
  if (target === mirroredFromPath) {
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
