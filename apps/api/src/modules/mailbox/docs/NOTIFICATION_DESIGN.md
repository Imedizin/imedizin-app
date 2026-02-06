# Notification design: user and admin panel

This document describes how we notify **users** (mail view) and **admin panel** when changes happen (e.g. new email received), so both can display updates in real time.

---

## Flow

```
Domain event (EmailReceived)
    → EmailReceivedNotificationHandler
    → RealtimePublisher.emit({ topic: 'email.received', payload, scope })
    → Socket.IO gateway broadcasts to connected clients
    → Handler also creates persisted notification (inbox) via INotificationRepository
```

- **Handler** (`email-received-notification.handler.ts`) is the single place that turns the domain event into a notification. It calls `RealtimePublisher.emit()` for real-time delivery and `notificationRepository.create()` for the persisted inbox.
- **Realtime** is delivered via Socket.IO (namespace `/realtime`). The frontend connects with the Socket.IO client and listens for `email.received` events.

---

## Audiences

| Audience  | Goal                               | How they get real-time                         | What they get                     |
| --------- | ---------------------------------- | ---------------------------------------------- | --------------------------------- |
| **User**  | See new mail for their mailbox(es) | Connect to Socket.IO `/realtime` (optional scope by mailboxId) | Events for those mailboxes or all |
| **Admin** | See all new mail / activity        | Same; connect without filter                    | All `email.received` events       |

- **User (mail app):** Frontend can pass scope (e.g. selected mailbox). Backend emits with `scope: { mailboxId }`; clients can filter or the UI can show only relevant updates.
- **Admin panel:** Connect to the same namespace; receive every `email.received` for a live activity feed.

---

## Payload: `email.received`

All clients receive the same event shape via Socket.IO (`event` name: `email.received`).

| Field            | Type                            | Purpose                                                                     |
| ---------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `topic`          | `'email.received'`              | Event type                                                                  |
| `timestamp`      | ISO string                      | When the notification was emitted                                           |
| `payload.mailboxId` | string (UUID)                | Which mailbox; used for filtering and linking                               |
| `payload.mailboxAddress` | string (optional)          | Email address of the mailbox for admin display                              |
| `payload.emailId`   | string (UUID)                | Stored email ID; link to email/thread detail                                |
| `payload.subject`   | string                        | Email subject                                                               |
| `payload.from`      | `{ emailAddress, displayName }` | Sender; for “From X” in toast/feed                                         |
| `payload.receivedAt`| string \| null                 | When the email was received (ISO)                                           |
| `scope.mailboxId`  | string (optional)              | Mailbox ID for filtering                                                    |

- **User:** Uses `payload` and `scope.mailboxId` for toasts and list refresh.
- **Admin:** Uses `payload.mailboxAddress` (or lookup) to show “Mailbox X received an email” in the activity feed.

---

## Transport: Socket.IO

- **Namespace:** `/realtime`
- **Event name:** `email.received`
- **Payload:** Object with `topic`, `payload`, `scope`, `timestamp` (see above).

The frontend uses the Socket.IO client; the Vite dev server proxies `/socket.io` to the API so the app can connect with the same origin.

---

## Persisted inbox (list)

- **Endpoint:** `GET /api/notifications` (query: `recipientType`, `recipientId`, `limit`, `offset`)
- The handler also creates a persisted notification per email so the notification panel (bell) can show history via this API.

---

## Summary

- **One event type** for “email received”: `email.received`, with `mailboxId`, `mailboxAddress` (optional), `emailId`, `subject`, `from`, `receivedAt` in the payload.
- **One handler** turns the domain event into realtime (via RealtimePublisher) and persisted inbox (via notification repository).
- **Realtime** is delivered over Socket.IO; **inbox** is served by `GET /api/notifications`.
