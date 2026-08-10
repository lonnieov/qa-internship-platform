# Hash Routing

## Purpose

Show app routes in hash-route form while keeping Next.js server-rendered routes,
auth guards, and Server Actions loadable through canonical paths.

## Scope

- Hash URLs such as `/#/ru/sign-in/admin` and `/#/uz/admin/interns?query=ali`
  are accepted on the client and restored in the address bar after load.
- The bridge resolves a valid hash route to the matching locale-prefixed path,
  then replaces the visible URL back to hash-route form.
- Plain anchors such as `#team`, mail links, and unknown paths are ignored.
- Canonical server routes such as `/ru/admin` continue to work.

## Data Model

No storage or schema changes.

## Main Flow

1. `app/layout.tsx` mounts `components/hash-route-bridge.tsx`.
2. The bridge reads `window.location.hash` on mount and on `hashchange`.
3. `src/lib/hash-routing.ts` validates hashes that start with `#/`.
4. Valid locale routes are converted to canonical paths with query and inner hash
   preserved.
5. The browser is redirected to that canonical path so the server page can load.
6. Once the page is loaded, `history.replaceState` shows the matching `/#/...`
   route without adding another history entry.

## Touched Files

- `app/layout.tsx`
- `components/hash-route-bridge.tsx`
- `src/lib/hash-routing.ts`

## Constraints

- Browser hash fragments are not sent to the server.
- Server-rendered pages must still load by canonical path after hash resolution.
- The bridge only accepts `/`, `/ru/...`, and `/uz/...` routes.
- Existing Server Action redirects and protected page redirects stay canonical.
- Plain in-page anchors are left alone and are not converted to route hashes.
