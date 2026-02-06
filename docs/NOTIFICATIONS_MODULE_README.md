# Notifications module (business-agnostic)

This module is **not coupled** to mailbox, orders, or any app-specific domain. It provides:

- **Realtime:** Real-time events are delivered via Socket.IO (realtime module, namespace `/realtime`). Emitters call `RealtimePublisher.emit(event)`; the Socket.IO gateway broadcasts to connected clients.
- **Inbox (persisted):** Create/list/mark-read notifications scoped by **recipient** `(recipientType, recipientId)`, e.g. `user`/userId or `mailbox`/mailboxId.

## Recipient model

- **recipientType:** string (e.g. `user`, `mailbox`, `channel`)
- **recipientId:** string (e.g. user UUID, mailbox UUID)

Callers (mailbox, IAM, etc.) choose the pair. This module only stores and filters by it.

## API (recipient-based)

- Real-time: connect to Socket.IO namespace `/realtime` (see realtime module).
- `GET /api/notifications?recipientType=…&recipientIds=…&page=1&limit=20&unreadOnly=false`
- `GET /api/notifications/unread-count?recipientType=…&recipientIds=…`
- `PATCH /api/notifications/:id/read`
- `POST /api/notifications/read-all?recipientType=…&recipientIds=…`

## Using from another module

1. **Import** `NotificationsModule` and `RealtimeModule`; inject `RealtimePublisher` and `INotificationRepository`.
2. **Realtime:** Call `realtimePublisher.emit({ topic: '…', payload, scope })` (Socket.IO gateway broadcasts to clients).
3. **Inbox:** Call `notificationRepository.create({ recipientType, recipientId, type, title, body?, data? })`.

Example (mailbox): `recipientType='mailbox'`, `recipientId=mailboxId`.
