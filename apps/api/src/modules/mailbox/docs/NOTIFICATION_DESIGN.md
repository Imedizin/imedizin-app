# Notification design: user and admin panel

This document describes how we notify **users** (mail view) and **admin panel** when changes happen (e.g. new email received), so both can display updates in real time.

---

## Flow

```
Domain event (EmailReceived)
    → EmailReceivedNotificationHandler
    → NotificationService.emitEmailReceived(...)
    → emit() → broadcastToSSEClients + channels
    → SSE clients (user app + admin panel)
```

- **Handler** (`email-received-notification.handler.ts`) is the single place that turns the domain event into a notification. It does not decide *who* gets it; it just calls `NotificationService`.
- **NotificationService** broadcasts the same payload to all registered channels (SSE today) and to every SSE client that matches the notification (see filtering below).
- **Who receives what** is determined by how the client connects (query params) and optional auth.

---

## Audiences

| Audience  | Goal                               | How they connect                                   | What they get                     |
| --------- | ---------------------------------- | -------------------------------------------------- | --------------------------------- |
| **User**  | See new mail for their mailbox(es) | `GET /api/notifications/stream?mailboxIds=id1,id2` | Only events for those mailbox IDs |
| **Admin** | See all new mail / activity        | `GET /api/notifications/stream` (no filter)        | All `email.received` events       |

- **User (mail app):** Pass `mailboxIds` = the mailboxes the current user cares about (e.g. selected mailbox or list of allowed mailboxes). Backend only sends events whose `mailboxId` is in that set.
- **Admin panel:** Connect **without** `mailboxIds`. Backend sends every `email.received` event so the admin can show a live activity feed (e.g. “support@example.com received an email from …”).

Same endpoint, same event type; only the filter (presence/value of `mailboxIds`) changes.

---

## Payload: `email.received`

All clients receive the same event shape. Include enough for both user and admin to display without extra API calls.

| Field            | Type                            | Purpose                                                                     |
| ---------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `type`           | `'email.received'`              | Event type                                                                  |
| `timestamp`      | ISO string                      | When the notification was emitted                                           |
| `mailboxId`      | string (UUID)                   | Which mailbox; used for filtering and linking                               |
| `mailboxAddress` | string (optional)               | Email address of the mailbox (e.g. `support@example.com`) for admin display |
| `emailId`        | string (UUID)                   | Stored email ID; link to email/thread detail                                |
| `subject`        | string                          | Email subject                                                               |
| `from`           | `{ emailAddress, displayName }` | Sender; for “From X” in toast/feed                                          |
| `receivedAt`     | string \| null                  | When the email was received (ISO)                                           |

- **User:** Uses `mailboxId`, `emailId`, `subject`, `from`, `receivedAt` for toasts and list refresh.
- **Admin:** Uses `mailboxAddress` (or `mailboxId` + lookup) to show “Mailbox X received an email” in the activity feed.

---

## Transport: SSE (current)

- **Endpoint:** `GET /api/notifications/stream`
- **Query:** `mailboxIds` (optional) – comma-separated mailbox UUIDs. Omit for “all” (admin).
- **Response:** `Content-Type: text/event-stream`. Each event is a line: `data: <JSON>\n\n`.
- **Events:** `connected` (once on connect), then `email.received` (and later `email.updated`, `email.deleted`), plus server heartbeat comments.

Future: same payload can be sent over WebSocket or push by adding another channel that subscribes to `NotificationService` and forwards the same JSON.

---

## Display

| Audience  | Suggested UI                                                                                                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**  | Toast: “New email from &lt;from&gt;: &lt;subject&gt;”. Invalidate email/thread lists so the list and open thread refresh. Optional: notification panel with recent items.                       |
| **Admin** | Live activity feed: rows like “&lt;mailboxAddress&gt; – new email from &lt;from&gt; – &lt;subject&gt;” with link to mailbox/email. Optional: badge/count of new emails per mailbox or globally. |

Frontend should handle `type === 'email.received'` and optionally use `mailboxAddress` when present (admin).

---

## Auth (recommended)

- **User stream:** Require auth; restrict `mailboxIds` to mailboxes the user is allowed to see (e.g. from session or API that returns “my mailboxes”). Prefer passing only allowed IDs rather than trusting the client to self-filter.
- **Admin stream:** Require admin role; only allow “no filter” (all events) for admins. Optionally rate-limit or cap connections per user.

Auth is not implemented in this module; add it in the controller or a guard that runs before opening the SSE response.

---

## Summary

- **One event type** for “email received”: `email.received`, with `mailboxId`, `mailboxAddress` (optional), `emailId`, `subject`, `from`, `receivedAt`.
- **One handler** turns the domain event into a notification; **NotificationService** broadcasts to SSE (and future channels).
- **User:** connect with `mailboxIds=...`; show toasts and refresh lists.
- **Admin:** connect with no filter; show activity feed using `mailboxAddress` and the same payload.
