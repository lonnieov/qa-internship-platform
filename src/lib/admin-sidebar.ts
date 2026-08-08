// Shared between the server layout (reads the cookie) and the client shell
// (writes it). Kept out of the "use client" module because every export of a
// client module becomes a client reference on the server, not a plain string.
export const ADMIN_SIDEBAR_COLLAPSED_COOKIE = "admin_sidebar_collapsed";

export const ADMIN_SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
