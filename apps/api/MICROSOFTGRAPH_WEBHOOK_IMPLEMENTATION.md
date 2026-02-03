# Microsoft Graph Webhook Implementation

This document explains the webhook implementation for receiving email notifications from Microsoft Graph.

## Overview

The webhook receives notifications from Microsoft Graph when emails are created, updated, or deleted in subscribed mailboxes.

## Architecture

```
Microsoft Graph → Webhook Controller → Webhook Handler Service → Process Notification
```

## Components

### 1. MicrosoftgraphWebhookController

**Location:** `api/controllers/microsoftgraph-webhook.controller.ts`

#### GET Handler - Validation Request
**Route:** `GET /mailbox/webhooks/graph?validationToken={token}`

**Steps:**
1. Microsoft Graph sends GET request with `validationToken` query parameter
2. Check if `validationToken` exists
3. If exists: Return 200 with the token as plain text (Microsoft requirement)
4. If missing: Return 400 Bad Request

**Purpose:** Microsoft Graph validates that your webhook endpoint is accessible and working.

#### POST Handler - Notification Request
**Route:** `POST /mailbox/webhooks/graph`

**Steps:**
1. Receive notification payload from Microsoft Graph
2. Log notification details (timestamp, number of changes)
3. Call `webhookHandler.handleNotification()` to process
4. Return 202 Accepted immediately (Microsoft expects quick response)
5. If error occurs, still return 202 (Microsoft will retry if needed)

**Purpose:** Receive and acknowledge email change notifications.

---

### 2. MicrosoftgraphWebhookHandlerService

**Location:** `application/services/microsoftgraph-webhook-handler.service.ts`

#### handleNotification Method

**Steps:**
1. Log that notification processing started
2. Check if notification has any changes (`notification.value`)
3. If no changes: Log warning and return
4. Loop through each change in `notification.value`
5. For each change, call `processChange()`

#### processChange Method

**Steps:**
1. Log the change type and subscription ID
2. **Validate subscription exists:**
   - Look up subscription in database using `subscriptionId`
   - If not found: Log warning and return (skip this change)
3. **Extract IDs from resource URL:**
   - Call `extractIdsFromResource()` to get mailboxId and messageId
   - Log extracted IDs
4. **Log notification details:**
   - Subscription ID
   - Change type (created/updated/deleted)
   - Mailbox ID
   - Message ID
   - Resource URL
   - Expiration date
5. **TODO - Future enhancements:**
   - Fetch email details from Microsoft Graph API using messageId
   - Store email in database
   - Emit events for real-time updates
   - Handle different change types (created/updated/deleted) differently

#### extractIdsFromResource Method

**Steps:**
1. Parse the resource URL (e.g., `/users/{mailboxId}/messages/{messageId}`)
2. Extract mailbox ID using regex: `/users/([^\/\?]+)/`
3. Extract message ID using regex: `/messages/([^\/\?]+)/`
4. Return object with `mailboxId` and `messageId` (or null if not found)

**Example:**
- Input: `/users/support@example.com/messages/AAMkAGI2...`
- Output: `{ mailboxId: 'support@example.com', messageId: 'AAMkAGI2...' }`

---

## Data Flow Example

### Scenario: New Email Received

1. **Microsoft Graph sends POST request:**
   ```
   POST /mailbox/webhooks/graph
   Body: {
     "value": [{
       "subscriptionId": "abc123",
       "changeType": "created",
       "resource": "/users/support@example.com/messages/AAMkAGI2...",
       ...
     }]
   }
   ```

2. **Controller receives request:**
   - Logs notification received
   - Calls handler service

3. **Handler service processes:**
   - Validates subscription "abc123" exists in database
   - Extracts mailboxId: "support@example.com"
   - Extracts messageId: "AAMkAGI2..."
   - Logs all details

4. **Controller responds:**
   - Returns 202 Accepted immediately

5. **Future (TODO):**
   - Fetch full email from Microsoft Graph API
   - Store email in database
   - Notify frontend via WebSocket

---

## Error Handling

- **Subscription not found:** Log warning, skip processing (don't fail)
- **Invalid resource URL:** Log error, continue with other changes
- **Processing error:** Log error, still return 202 (Microsoft will retry)

---

## Next Steps (TODO)

1. **Fetch email details:**
   - Call Microsoft Graph API: `GET /users/{mailboxId}/messages/{messageId}`
   - Get full email content (subject, body, attachments, etc.)

2. **Store in database:**
   - Create Email entity
   - Create EmailParticipants (from, to, cc, etc.)
   - Create EmailAttachments if any

3. **Real-time updates:**
   - Emit WebSocket event to notify frontend
   - Update email list in real-time

4. **Handle change types:**
   - `created`: Fetch and store new email
   - `updated`: Update existing email
   - `deleted`: Mark email as deleted or remove from database
