# Native Dialog Modals

## Purpose

Move user-facing modal windows from custom overlay markup to the native
`<dialog>` element with shared top-layer behavior.

## Scope

- Admin create, manage, track, wave, master, and candidate modals use `<dialog>`.
- Intern finish and comment dialogs use `<dialog>`.
- Footer contact modal uses `<dialog>`.
- Dialogs open with `showModal()`, close with Esc, close buttons, or backdrop clicks.
- Dialog enter and exit states animate with modern CSS top-layer transitions.
- Dialogs keep a single shared close listener and render only after client mount.

## Data Model

No storage or schema changes.

## Main Flow

1. A component stores its modal open state.
2. `components/ui/native-dialog.tsx` mounts the portal on the client and syncs
   that state to `dialog.showModal()` or
   `dialog.close()`.
3. The dialog gets `closedby="any"` for native light-dismiss support.
4. A shared coordinate-based fallback backs up backdrop clicks across browsers.
5. `app/globals.css` animates the dialog and `::backdrop`.

## Touched Files

- `app/globals.css`
- `components/ui/native-dialog.tsx`
- `components/site-footer-contact-modal.tsx`
- `components/intern/test-runner.tsx`
- `components/admin/admin-manage-modal.tsx`
- `components/admin/intern-candidate-table.tsx`
- `components/admin/invitation-create-modal.tsx`
- `components/admin/master-add-modal.tsx`
- `components/admin/question-create-modal.tsx`
- `components/admin/track-manage-modal.tsx`
- `components/admin/wave-manage-modal.tsx`

## Constraints

- Dialogs must be opened through `showModal()` to keep native focus handling.
- Each dialog needs an accessible label through `aria-labelledby` or `aria-label`.
- CSS transitions include `display`, `overlay`, and `transition-behavior:
  allow-discrete`.
- Reduced-motion users get shortened fade-only transitions.
- Dialog close state must be reported through the shared `close`/`cancel`
  listener, not duplicated per caller.
- The manual QA sandbox bottom sheet remains custom because it represents a mocked
  mobile app screen, not the platform modal primitive.
