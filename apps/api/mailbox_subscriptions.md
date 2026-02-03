# Microsoft Mailbox & Subscription Module Design

## 1. Overview
This document describes the design for managing Microsoft mailboxes and Microsoft Graph subscriptions in the system. It is built to start Microsoft-only but is future-proofed for other providers using a hybrid approach.

### Goals
- Track mailboxes and their Microsoft Graph subscriptions.
- Handle subscription lifecycle: creation, renewal, expiration.
- Process webhook notifications securely.
- Keep the system scalable for multiple providers in the future.

### Core Concepts
1. **Mailbox**: Represents an email account in the system.
2. **Subscription**: Represents a Microsoft Graph webhook subscription for a mailbox.
3. **Provider Abstraction**: Handles provider-specific logic (Microsoft in the first version).


## 2. Database Design

### 2.1 Mailboxes Table
Stores Microsoft mailbox information.

```sql
CREATE TABLE mailboxes (
    id UUID PRIMARY KEY,
    provider VARCHAR(50) NOT NULL DEFAULT 'microsoft',
    email VARCHAR(255) NOT NULL UNIQUE,
    external_id VARCHAR(255),             -- Microsoft Graph user/mailbox id
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',  -- active / disabled / error
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Mailbox Subscriptions Table
Stores subscription info, using hybrid approach with a JSON field for provider-specific data.

```sql
CREATE TABLE mailbox_subscriptions (
    id UUID PRIMARY KEY,
    mailbox_id UUID REFERENCES mailboxes(id) ON DELETE CASCADE,

    provider VARCHAR(50) NOT NULL DEFAULT 'microsoft',
    provider_subscription_id VARCHAR(255) NOT NULL,

    status VARCHAR(20) DEFAULT 'active',  -- active / expired / failed / disabled
    expiration_at TIMESTAMP,
    last_renewed_at TIMESTAMP,
    last_notification_at TIMESTAMP,
    error_message TEXT,

    provider_data JSON,  -- e.g., resource, changeTypes, notificationUrl, clientState

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_mailbox_subscriptions_mailbox_id ON mailbox_subscriptions(mailbox_id);
CREATE INDEX idx_mailbox_subscriptions_provider_subscription_id ON mailbox_subscriptions(provider_subscription_id);
CREATE INDEX idx_mailbox_subscriptions_expiration ON mailbox_subscriptions(expiration_at);
```


## 3. Microsoft Graph Provider Data
Example `provider_data` JSON for Microsoft Graph:
```json
{
  "resource": "/users/{id}/messages",
  "changeTypes": "created,updated",
  "notificationUrl": "https://yourapp.com/webhook",
  "clientState": "random-string"
}
```


## 4. Subscription Lifecycle

### 4.1 States
- `active`: subscription is valid
- `expiring`: approaching expiration, needs renewal
- `expired`: subscription expired, must be recreated
- `failed`: subscription renewal failed, requires retry
- `disabled`: manually disabled

### 4.2 Flow
1. **Creation**: When a mailbox is added, create Microsoft Graph subscription and store in `mailbox_subscriptions`.
2. **Renewal**: Background job checks subscriptions nearing expiration and renews them via Graph API.
3. **Expiration Handling**: If subscription expires, recreate it and update the database.
4. **Failure Handling**: Log errors, mark `failed`, retry later.


## 5. Webhook Handling
- Validate Microsoft Graph `validationToken` for subscription verification.
- Match notifications by `provider_subscription_id`.
- Update `last_notification_at`.
- Fetch full mailbox/message data from Graph API to ensure integrity.


## 6. Provider Abstraction
Interface for subscription handling (Microsoft-only for now, extendable later):
```ts
interface MailProviderSubscriptionService {
  create(mailbox): Promise<Subscription>;
  renew(subscription): Promise<Subscription>;
  delete(subscription): Promise<void>;
}

class MicrosoftSubscriptionService implements MailProviderSubscriptionService {
  /* Implementation calling Graph API */
}
```


## 7. Background Jobs
- **Renewal Job**: Runs periodically to renew subscriptions expiring soon.
- **Self-Healing Job**: Ensures subscriptions exist for all active mailboxes.
- **Error Handling**: Failed renewals are logged and retried.


## 8. Future Proofing
- The hybrid `mailbox_subscriptions` table can store subscriptions for other providers in the future.
- Provider-specific fields stored in JSON allows flexibility.
- Generic jobs can later loop over `provider` instead of only Microsoft.


## 9. Optional Startup Strategy
- On system startup, scan all active Microsoft mailboxes.
- Ensure subscriptions exist and are valid.
- Recreate any missing or expired subscriptions to make the system self-healing.


## 10. Notes on Other Providers (For Reference)
- Gmail: Uses `users.watch`, expires ~7 days, needs `resourceId` and `historyId`.
- IMAP IDLE: Track last UID processed and connection state.
- SaaS Webhooks (Slack, Stripe, Shopify): Track subscription ID, expiration/status, last event received, retries.


---

This document provides a **full Microsoft-only subscription management design**, ready for implementation, while keeping the structure scalable for multiple providers in the future.
