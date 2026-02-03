# Webhook Flow: Current Implementation vs Reference

Comparison of your current Graph webhook flow with the reference flow (validation, notifications, processing rules, delta sync, checklist).

---

## 1) Subscription validation request

### Reference

- **When:** One-time when you create the subscription.
- **Request:** `POST /webhooks/graph?validationToken=V4fy2...` (or GET) with `Content-Type: text/plain`.
- **Rule:** If `req.query.validationToken` exists → return it as **plain text** (200 OK) and stop.

### Your implementation

| Aspect                      | Status | Notes                                                                                                                    |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| GET with `validationToken`  | ✅      | `handleValidation()` returns token as `text/plain`, 200.                                                                 |
| POST with `validationToken` | ✅      | `handleNotification()` checks query param first, calls `handleValidationToken()`.                                        |
| Response body               | ✅      | `res.status(200).send(validationToken)` — plain text.                                                                    |
| Content-Type                | ✅      | `text/plain; charset=utf-8`.                                                                                             |
| Path                        | ⚠️      | Yours: `GET/POST /mailbox/webhooks/graph`. Reference example: `POST /webhooks/graph`. Path is a design choice; no issue. |

**Verdict:** Aligned. Validation is handled correctly for both GET and POST.

---

## 2) Normal change notification payload

### Reference

- Body: `{ "value": [ { subscriptionId, clientState, changeType, resource, resourceData } ] }`.
- Use `clientState` to validate; use `resourceData.id` optionally (reference recommends ignoring it and using delta).

### Your implementation

| Aspect                           | Status | Notes                                                                                                                                                                                             |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parse `body.value`               | ✅      | `ProcessNotificationCommand` iterates `notification.value`.                                                                                                                                       |
| Look up `subscriptionId` in DB   | ✅      | `subscriptionRepository.findBySubscriptionId(change.subscriptionId)`.                                                                                                                             |
| Validate `clientState`           | ✅      | Compared to `WEBHOOK_CLIENT_STATE` env. Reference also allows validating against **stored** clientState per subscription (you have `client_state` on `mailbox_subscriptions`); using env is fine. |
| Extract mailbox and enqueue sync | ✅      | You resolve mailbox and call `SyncMailboxCommand.execute(mailboxId)` (see queue note below).                                                                                                      |
| Return 200 or 202 quickly        | ✅      | `res.status(202).json(...)` then `processNotificationCommand.execute(notification).catch(...)` — no heavy work before response.                                                                   |
| Use of `resourceData.id`         | ✅      | You ignore it and run delta sync (Pattern 1 — recommended).                                                                                                                                       |

**Verdict:** Aligned with the reference. One bug was fixed: mailbox was looked up with `findByAddress(subscription.mailboxId)`; `subscription.mailboxId` is the mailbox UUID, so it’s now `findById(subscription.mailboxId)`.

---

## 3) Rich notifications (encrypted resource data)

### Reference

- If you enable resource data, Graph can send `encryptedContent` (data, dataKey, signature, certificateId). Decryption requires your certificate/private key.
- Recommendation: skip rich notifications and use delta + GET on demand.

### Your implementation

- You do **not** use rich notifications. You only use the standard `value` array and `resourceData.id` (and you don’t use the id for fetch). No `encryptedContent` handling.
- **Verdict:** Aligned — you rely on delta + GET, which matches the reference.

---

## A) Webhook handler (fast + safe)

### Reference

1. If `validationToken` present → return as plain text (200).
2. Otherwise parse JSON.
3. For each item in `body.value`: look up subscription, validate clientState, enqueue `SyncMailbox(mailboxId)`.
4. Return 200 or 202 immediately.

### Your implementation

| Step                                       | Status | Notes                                                                                                                                                                                                         |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Validation token                        | ✅      | Done in both GET and POST.                                                                                                                                                                                    |
| 2. Parse JSON                              | ✅      | Nest parses body; you pass `notification` to the command.                                                                                                                                                     |
| 3. Per item: lookup + validate + “enqueue” | ✅      | You do lookup + clientState check + call `syncMailboxCommand.execute(mailboxId)`. You do **not** use a queue; you run sync in-process after sending 202. Comment in code: “Phase 3 will be moved to a queue”. |
| 4. Return 202 immediately                  | ✅      | Response is sent before `processNotificationCommand.execute()`.                                                                                                                                               |

**Gap:** Processing is **in-process async** (fire-and-forget), not a **durable queue**. Under load or restart, work can be lost. Reference recommends “enqueue a job”; your plan (Phase 4 in WEBHOOK_PROCESSING_PLAN.md) is to add BullMQ. No change needed for correctness now; queue is the next step for production resilience.

---

## B) Worker job (source of truth = delta)

### Reference

1. Acquire per-mailbox lock (avoid concurrent cursor updates).
2. Call delta with stored cursor (first run: delta URL; later: stored `@odata.deltaLink`).
3. Upsert each message (idempotent).
4. Store **new `@odata.deltaLink`** only after successful processing.

### Your implementation

| Step                             | Status | Notes                                                                                                                                             |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Per-mailbox lock              | ✅      | `syncingMailboxes` Set in `ProcessNotificationCommand`; skip if mailbox already syncing.                                                          |
| 2. Delta with stored cursor      | ✅      | No `deltaLink`: `bootstrapDeltaLink()` then store. Has `deltaLink`: `getMessagesDelta(mailbox.address, mailbox.deltaLink)`.                       |
| 3. Upsert / idempotent           | ✅      | `existsByMessageId(messageId)` → skip if exists; otherwise `emailRepository.create()`. Effectively “insert if not exists” (unique on message id). |
| 4. Store deltaLink after success | ✅      | `await this.mailboxRepository.updateDeltaLink(mailbox.id, deltaLink)` after processing all messages in the batch.                                 |

**Verdict:** Aligned. Delta is the source of truth; cursor is updated only after successful processing.

---

## Checklist (production)

| Item                                                           | Reference | Your implementation                                                                                                                                                       |
| -------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Store subscriptionId, clientState, expiresAt, mailbox identity | ✅         | `mailbox_subscriptions`: subscriptionId, clientState, expirationDateTime, mailboxId, resource, etc.                                                                       |
| Renew subscriptions before expiry                              | ⚠️         | Cron + `RenewSubscriptionsCommand` exist, but renewal has a TODO and does **not** call Graph API; it only updates expiration in DB. Real renewal still to be implemented. |
| Webhook does no heavy work                                     | ✅         | 202 then async `processNotificationCommand.execute()`.                                                                                                                    |
| Worker uses deltaLink cursoring                                | ✅         | `mailbox.deltaLink` stored on mailbox; bootstrap when null.                                                                                                               |
| Idempotency (e.g. (mailboxId, messageId) unique)               | ✅         | `existsByMessageId()` before create; DB should enforce uniqueness on message id (or mailboxId + messageId).                                                               |

---

## Summary

| Area                                                                                | Match | Action                                                                                 |
| ----------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------- |
| Validation (GET/POST, plain text)                                                   | ✅     | None.                                                                                  |
| Notification handling (202, parse value, validate clientState, lookup subscription) | ✅     | Fixed: use `findById(subscription.mailboxId)` instead of `findByAddress`.              |
| Pattern: notification → delta sync (ignore resourceData.id for fetch)               | ✅     | None.                                                                                  |
| Per-mailbox lock                                                                    | ✅     | None.                                                                                  |
| Delta cursor (bootstrap + incremental, store after success)                         | ✅     | None.                                                                                  |
| Idempotent upsert                                                                   | ✅     | None.                                                                                  |
| Durable queue                                                                       | ⚠️     | Planned (Phase 4); current flow is in-process async.                                   |
| Subscription renewal via Graph API                                                  | ⚠️     | Implement real renewal in `RenewSubscriptionsCommand` (call Graph PATCH subscription). |

Overall, your flow matches the reference: fast ACK, validate + lookup, delta-based sync, cursor stored after success, idempotent writes. Remaining improvements: add a queue for processing and implement real subscription renewal with Microsoft Graph.
