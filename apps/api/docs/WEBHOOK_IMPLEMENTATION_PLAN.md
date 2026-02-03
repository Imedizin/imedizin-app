# Microsoft Graph Webhook — Full Implementation Plan

Stages from **minimal (works today)** to **advanced (high reliability + scale)** for:

- Microsoft Graph **new mail notifications (webhook)**
- Queue **job per messageId**
- Fetch message + **download attachments**
- Save attachments to **disk or S3**
- Strong **failure handling** (retries, DLQ, replay)

Each stage is shippable — you can stop at any point.

---

## Stage 0 — Minimal working prototype

### Goal

Prove you can receive "new message" events and fetch the message by `messageId`.

### Steps

1. **Expose a public HTTPS endpoint** `/graph/notifications`
2. Implement **validationToken echo** (required for subscription validation). ([Microsoft Learn][1])
3. Create a subscription for Inbox messages:
   - `resource = me/mailFolders('Inbox')/messages`
   - `changeType=created` ([Microsoft Learn][1])
4. On notification, log:
   - `subscriptionId`
   - `resource`
   - `resourceData.id` (messageId)
5. Fetch the message with `GET /messages/{id}` and log subject/from. ([Microsoft Learn][2])

**Done when:** you see notifications, and you can fetch the message by id.

**Status:** [ ]

---

## Stage 1 — Minimal production shape: webhook → queue job (messageId only)

### Goal

Webhook is fast and safe; actual work happens in a worker.

### Steps

1. Webhook does only:
   - validate `clientState`
   - extract `{userId, messageId}`
   - enqueue `new-message` job
   - return **202 immediately**
2. Use deterministic `jobId = userId:messageId` to dedupe.
3. Worker:
   - fetch message by id
   - run simple handler (store subject/from/date in DB)

**Done when:** webhook stays fast and email processing survives restarts.

**Status:** [ ]

---

## Stage 2 — Attachments v1: list + download + save to disk

### Goal

Handle file attachments for each message and store locally.

### Steps

1. In worker, after fetching message:
   - call `GET /messages/{id}/attachments` to list attachments. ([Microsoft Learn][3])
2. For each attachment:
   - if `@odata.type` is `fileAttachment` or `itemAttachment`
   - download raw bytes via `GET .../attachments/{attachmentId}/$value` ([Microsoft Learn][4])
3. Save to disk using streaming:
   - write to temp file first
   - rename to final filename on success
4. Store DB records:
   - message row
   - attachment rows with `attachmentId`, `name`, `size`, `path`, `status`

**Done when:** you can process a message and see files on disk.

**Status:** [ ]

---

## Stage 3 — Attachments v2: upload to S3 (streaming)

### Goal

Store attachments in S3 and keep processing idempotent.

### Steps

1. Choose deterministic S3 key structure (example):
   - `mail/{tenantOrUser}/{messageId}/{attachmentId}-{filename}`
2. For each attachment stream from Graph `/$value` into S3 multipart upload
3. Save DB record with:
   - `bucket`, `key`, `etag/version` (if you use versioning), `bytes`
4. Idempotency:
   - unique key `(userId, messageId, attachmentId)`
   - if already uploaded, skip (or do HEAD on S3)

**Done when:** same message can be retried and you don't duplicate uploads.

**Status:** [ ]

---

## Stage 4 — Failure handling: retries + DLQ + checkpointing

### Goal

No lost emails; failures are diagnosable; retries don't cause duplicates.

### Steps

1. Add a **classifier** for failures:
   - **Retry:** 404 (eventual consistency), 429, 5xx, timeouts
   - **DLQ:** 401/403, repeated 4xx (bad request), policy violations
2. Queue settings:
   - attempts: 8–12
   - exponential backoff
   - respect `Retry-After` when throttled (429)
3. Add **checkpointing**:
   - message state: fetched/processed
   - per attachment: downloaded/uploaded
4. DLQ payload includes:
   - userId, messageId, subscriptionId
   - which step failed (FETCH_MESSAGE / LIST_ATTACHMENTS / DOWNLOAD / UPLOAD_S3)
   - error + status code + attempt count
5. Add a simple **replay command** (admin endpoint or CLI) that re-enqueues DLQ jobs.

**Done when:** you can intentionally break S3 and see jobs end up in DLQ with useful info.

**Status:** [ ]

---

## Stage 5 — Reliability upgrades: lifecycle notifications + missed events guard

### Goal

Reduce missed notifications and subscription surprises.

### Steps

1. Add `lifecycleNotificationUrl` and handle lifecycle events:
   - `reauthorizationRequired`
   - `subscriptionRemoved`
   - `missed` ([Microsoft Learn][5])
2. Renew subscriptions proactively (cron/worker):
   - store `subscriptionId` + `expirationDateTime`
   - renew well before expiry
3. Missed notification recovery:
   - on `missed`, run a **delta sync** for Inbox to reconcile. ([Microsoft Learn][6])

**Done when:** if webhook delivery hiccups, you still reconcile new messages later.

**Status:** [ ]

---

## Stage 6 — Scale & performance: concurrency control + throttling strategy

### Goal

Handle many users / high volume safely.

### Steps

1. Worker concurrency:
   - limit global concurrency
   - optionally per mailbox concurrency (avoid hammering one user)
2. Throttling strategy:
   - exponential backoff + jitter
   - central rate limiter for Graph calls
3. Batch fetching:
   - prefer `$select` minimal fields
   - avoid downloading huge bodies unless needed
4. Observability:
   - structured logs with `jobId`, `userId`, `messageId`, `attachmentId`
   - metrics: success rate, retry rate, DLQ depth, Graph 429 rate

**Done when:** you can increase volume without hitting constant 429 storms.

**Status:** [ ]

---

## Stage 7 — Advanced features (optional)

Pick what you need:

### A) Support `referenceAttachment`

Those are links (OneDrive/SharePoint). You'll:

- detect `#microsoft.graph.referenceAttachment`
- read metadata (link)
- download through driveItem/SharePoint flow (separate pipeline)

### B) Security pipeline

- virus scan (ClamAV / third-party)
- file-type allowlist
- size quotas per tenant/user
- encryption at rest (S3 SSE-KMS) + key policies

### C) Compliance / audit

- immutable logs
- retention policies (delete after N days)
- WORM storage (S3 Object Lock) if required

---

## Recommended implementation order (fastest path)

1. **Stage 1** — webhook → queue job with messageId
2. **Stage 3** — S3 upload streaming
3. **Stage 4** — retries + DLQ + checkpointing

That combination gives you "production-grade" behavior quickly.

---

## References

- [1] [Microsoft Learn — webhook subscription](https://learn.microsoft.com/en-us/graph/webhooks)
- [2] [Microsoft Learn — get message](https://learn.microsoft.com/en-us/graph/api/message-get)
- [3] [Microsoft Learn — list attachments](https://learn.microsoft.com/en-us/graph/api/message-list-attachments)
- [4] [Microsoft Learn — get attachment content](https://learn.microsoft.com/en-us/graph/api/attachment-get)
- [5] [Microsoft Learn — lifecycle notifications](https://learn.microsoft.com/en-us/graph/webhooks-lifecycle)
- [6] [Microsoft Learn — delta query](https://learn.microsoft.com/en-us/graph/delta-query-overview)
