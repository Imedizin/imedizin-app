# Webhook Notification Processing Plan

## Overview
Process Microsoft Graph webhook notifications using a **hybrid approach** with delta sync for reliability.

---

## Architecture: Hybrid Webhook + Delta Sync

```
Webhook Notification → Validate → Trigger Delta Sync → Process Changes → Store
```

**Benefits:**
- Real-time: Webhooks trigger immediate sync
- Resilient: Delta query catches any missed notifications
- Efficient: Deduplication prevents storing same email twice
- Recovery: Easy to catch up after downtime

---

## Phase 1: Basic Flow with Delta Sync (COMPLETE)

### Tasks
1. **Validate clientState** - Verify notification authenticity
2. **Look up subscription** - Find mailbox from `subscriptionId`
3. **Trigger delta sync** - Use delta query instead of single message fetch
4. **Process all changes** - Handle created/updated/deleted messages
5. **Store deltaLink** - Save for next incremental sync
6. **Deduplication** - Skip messages already in database

### Files Created/Modified
- [x] `domain/entities/email.entity.ts` - Email domain entity
- [x] `domain/entities/mailbox.entity.ts` - Added deltaLink, lastSyncAt
- [x] `domain/interfaces/email.repository.interface.ts` - Repository interface
- [x] `domain/interfaces/mailbox.repository.interface.ts` - Added updateDeltaLink
- [x] `infrastructure/schema.ts` - Added deltaLink, lastSyncAt to mailboxes
- [x] `infrastructure/repositories/email.repository.ts` - Repository implementation
- [x] `infrastructure/repositories/mailbox.repository.ts` - Added updateDeltaLink
- [x] `application/services/graph.service.ts` - Added getMessage, getMessagesDelta
- [x] `application/commands/sync-mailbox.command.ts` - Delta sync logic
- [x] `application/commands/process-notification.command.ts` - Triggers delta sync
- [x] `api/controllers/webhook.controller.ts` - Wire up the processor
- [x] `mailbox.module.ts` - Register new providers

### Database Migration Required
Add these columns to the `mailboxes` table:
```sql
ALTER TABLE mailboxes ADD COLUMN delta_link TEXT;
ALTER TABLE mailboxes ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE;
```

---

## Phase 2: Email API & Features (COMPLETE)
Add API endpoints and additional sync features.

### Tasks
- [x] API endpoints to list emails by mailbox
- [x] API endpoint to view single email with participants
- [ ] ~~Spam folder sync~~ (deferred to Phase 8)
- [x] Manual sync trigger endpoint
- [x] Email search functionality

### API Endpoints Created
- `GET /api/emails` - List all emails with pagination
- `GET /api/emails/search?q=query` - Search emails by subject/body
- `GET /api/emails/:id` - Get single email with participants
- `GET /api/emails/mailbox/:mailboxId` - List emails for a mailbox
- `POST /api/emails/mailbox/:mailboxId/sync` - Manual sync trigger

---

## Phase 3: Storage Enhancement
Store full email content and attachments in Azure Blob Storage.

### Tasks
- [ ] Store raw email source in blob storage
- [ ] Store attachments in blob storage
- [ ] Update email record with storage references

---

## Phase 4: Async Processing
Move to queue-based processing for reliability.

### Tasks
- [ ] Add BullMQ or similar queue
- [ ] Return 202 immediately from webhook
- [ ] Process notifications in background workers
- [ ] Add job retry logic

---

## Phase 5: Error Handling & Resilience
Production-ready error handling.

### Tasks
- [ ] Retry logic for transient Graph API failures
- [ ] Dead letter queue for failed notifications
- [ ] Duplicate detection (idempotency)
- [ ] Alerting for persistent failures
- [ ] Rate limiting handling

---

## Phase 6: Email Notifications & Alerts
Real-time notifications when new emails arrive.

### Tasks
- [ ] WebSocket/SSE for real-time updates to frontend
- [ ] Browser push notifications for new emails
- [ ] Email notification rules (filter by sender, subject, keywords)
- [ ] Notification preferences per user/mailbox
- [ ] Desktop notification support

### Architecture
```
New Email → SyncMailboxCommand → NotificationService → WebSocket/Push
```

### Implementation Options
1. **Server-Sent Events (SSE)** - Simple, one-way, good browser support
2. **WebSockets** - Bi-directional, more complex
3. **Polling** - Simplest, less real-time

---

## Phase 7: UI Features
Frontend improvements for email management.

### Tasks
- [ ] Compose/Reply functionality
- [ ] Mark as read/unread
- [ ] Delete emails
- [ ] Thread view (group by conversation)
- [ ] Attachments display
- [ ] Rich text editor for compose

---

## Phase 8: Additional Sync Features
Extended sync capabilities.

### Tasks
- [ ] Spam folder sync
- [ ] Multiple mailbox sync in parallel
- [ ] Full-text search improvements (PostgreSQL FTS or Elasticsearch)
- [ ] Sent folder sync
- [ ] Draft folder sync

---

## Notification Structure Reference

```json
{
  "value": [
    {
      "subscriptionId": "f813010f-b7f3-48ec-b9a4-88948dc776eb",
      "subscriptionExpirationDateTime": "2026-01-31T06:17:36.303+00:00",
      "changeType": "created",
      "resource": "Users/da3cd11e-5ada-4b30-b344-9ec0d10f19af/Messages/AAMkAGIy...",
      "resourceData": {
        "@odata.type": "#Microsoft.Graph.Message",
        "@odata.id": "Users/da3cd11e-5ada-4b30-b344-9ec0d10f19af/Messages/AAMkAGIy...",
        "@odata.etag": "W/\"CQAAABYAAABwjbNWLmGJRKbDoPVLbNXtAAAAFMbl\"",
        "id": "AAMkAGIy..."
      },
      "clientState": "my-super-secret",
      "tenantId": "12e6fdcb-fc90-4fc1-bc9a-c04f81633be7"
    }
  ]
}
```

---

## Database Schema (Existing)

### emails
- id, mailboxId, messageId, threadId, subject, bodyText, bodyHtml, rawSource, direction, sentAt, receivedAt

### email_participants
- id, emailId, emailAddress, displayName, type (from/to/cc/bcc/reply_to)

### email_attachments
- id, emailId, filename, mimeType, size, fileUrl, isInline
