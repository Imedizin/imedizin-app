# Assistance Requests ↔ Mail Threads Linking

## Overview

Link assistance requests (medical case / transport) to mail threads so users can associate email conversations with a case and open them from the request detail page.

**Modular monolith rule:** The assistance-requests module does **not** join or reference mailbox/emails tables. We store `thread_id` as an opaque string (the same value used by the mailbox module). No cross-module table joins.

---

## Data Model (assistance-requests module only)

- **New table:** `assistance_request_threads`
  - `assistance_request_id` (uuid, FK → `assistance_requests.id`, on delete cascade)
  - `thread_id` (text, not a FK — mailbox module owns threads)
  - Primary key: `(assistance_request_id, thread_id)`
  - Optional: `created_at` for audit

Thread IDs are the same values used in the mailbox module (`emails.thread_id`). We do not validate existence in the mailbox; the frontend can open `/mails/{threadId}` regardless.

---

## API (Phase 1)

- **GET list / GET by id:** Response already includes `threadIds: string[]` (loaded from `assistance_request_threads` in this module only).
- **POST** `api/assistance-requests/:id/threads` — body `{ "threadId": "string" }` — add link (idempotent).
- **DELETE** `api/assistance-requests/:id/threads/:threadId` — remove link.

All operations stay inside the assistance-requests module; no calls into the mailbox module.

---

## User Experience

### List (Assistance Requests)

- **No threads column** in the list for now. Users see linked threads only from the detail page.

### Detail (Medical case or Transport)

- **Section: "Linked mail threads"**
  - If none: message "No linked threads." + button **"Link a thread"**.
  - If any: list each linked thread with:
    - **"Open in Mails"** → navigates to `/mails/{threadId}`.
    - **"Unlink"** → removes the link.
  - Button **"Link a thread"** (or "Link another thread") opens a simple modal:
    - Input: **Thread ID** (user pastes from Mails URL or copy).
    - Buttons: Cancel, **Link**.

No thread picker or cross-module calls in Phase 1; optional in a later phase.

---

## Phases

| Phase | Scope |
|-------|--------|
| **Phase 1** | Junction table in assistance-requests; link/unlink API; detail-page UX (no list column). No joins to mailbox. |
| Phase 2 | Optional: thread picker (frontend calls mailbox API to list threads); Mails UI shows "Linked to: Request X". |
| Phase 3 | Optional: from Mails, "Link this thread to a request"; filter list by "has linked threads". |

---

## Implementation Notes

- Repository: `getThreadIdsForRequest(id)`, `addThread(requestId, threadId)`, `removeThread(requestId, threadId)`.
- Entity: `AssistanceRequest` gets `threadIds: string[]` (set when building from DB).
- Response DTO: include `threadIds` in the JSON.
- Frontend: no threads column in list; Linked threads card and Link/Unlink on detail pages (medical + transport).
- **Migration:** Run `drizzle/0001_assistance_request_threads.sql` (or your app’s migration runner) so the `assistance_request_threads` table exists.
