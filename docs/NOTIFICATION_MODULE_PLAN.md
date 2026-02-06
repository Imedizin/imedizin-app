# Notification Module — Phased Plan

A pragmatic phased notification module plan that starts MVP-simple but doesn’t paint you into a corner when you need scale. To be analyzed and enhanced later.

---

## Phase 0 — Foundations (before MVP)

**Goal:** Make later phases possible without rewrites.

### Domain model

* **NotificationEvent** (what happened): `type`, `actorId`, `entityRef`, `payload`, `tenantId`, `createdAt`
* **Notification** (what a user sees): `userId`, `channel`, `title/body`, `data`, `status`, `readAt`, `createdAt`

### Stable identifiers

* `eventId` and **idempotency key** (prevents duplicates when retries happen)

### User preferences shape (even if unused yet)

* `preferences: { channel: enabled, types: enabled, quietHours, digest }`

This lets you ship MVP with a subset of fields but keep the schema forward-compatible.

---

## Phase 1 — MVP (minimal, reliable, fast to ship)

**Goal:** In-app notifications only.

### Channels

* In-app only (bell dropdown + notifications page)

### Core features

* Create notification on specific triggers (e.g., “comment added”, “order status changed”)
* List notifications (paginated)
* Mark as read / mark all as read
* Unread count

### Architecture

* **Synchronous** write (inside the request) is okay for MVP:
  * When event happens → insert `Notification` rows for target users
* Keep it simple: one table, one service.

### Key design choices that help later

* Store `type` + `data` JSON (so you can render different templates later)
* Add `tenantId` if you’re multitenant
* Add `status` (even if always “delivered” in MVP)

### Deliverables

* DB tables
* CRUD endpoints
* UI components

---

## Phase 2 — “MVP+” (scalable internal structure without complexity)

**Goal:** Decouple event creation from fan-out.

### Changes

* Introduce `NotificationEvent` table (append-only)
* On business action: write **event** only (cheap + consistent)
* A worker/job consumes events and creates user notifications (fan-out)

### Why it matters

* Avoids slow requests when you notify many users
* Gives retries + observability
* Enables new channels later (email/SMS) using the same event

### Add

* Retry policy + dead-letter / failed jobs
* Basic deduplication using idempotency keys

---

## Phase 3 — Preferences + Targeting (personalization)

**Goal:** Right user, right channel, right time.

### Features

* User notification settings:
  * enable/disable per type
  * channel toggles (in-app/email/push)
  * quiet hours
* Role-based targeting rules (e.g., “course instructors”, “admins”)
* Per-tenant defaults + per-user overrides

### Implementation notes

* Preference evaluation happens in the worker:
  * event → resolve recipients → filter by preferences → create outputs

---

## Phase 4 — Multi-channel (Email, Push, SMS) + Template system

**Goal:** Consistent content across channels, easy to add new channels.

### Add channels

* Email (transactional)
* Push (FCM/APNs)
* SMS (optional)

### Template system

* Use `type` → template resolver
* Render per channel:
  * In-app: short text + deep link
  * Email: richer HTML + CTA
  * Push: concise title/body

### Operational

* Provider abstraction:
  * `EmailProvider`, `PushProvider`, `SmsProvider`
* Outbox table per channel:
  * `NotificationDeliveryAttempt` with status, provider response, retries

---

## Phase 5 — High scale improvements (performance + correctness)

**Goal:** Handle large fan-outs and high event volume.

### Upgrades

* Queue/broker (e.g., Redis/BullMQ → later Kafka/Rabbit if needed)
* Batch fan-out (chunk recipients)
* Precompute “recipient sets” for big groups (followers, subscribers)
* Rate limiting + per-user throttling (“max 5 per minute”)
* Digests (daily/weekly summaries)
* Collapsing/aggregation:
  * “10 new comments” instead of 10 separate notifications

### Data

* Partitioning by tenant/time for very large tables
* Index strategy:
  * `(tenantId, userId, createdAt desc)`
  * `(userId, readAt)` for unread queries

---

## Phase 6 — Enterprise-grade (audit, compliance, observability)

**Goal:** Long-term maintainability.

* Audit log of events and deliveries
* Message localization (i18n templates)
* Advanced analytics:
  * delivered/opened/clicked (per channel)
* GDPR/retention policies
* Admin tooling:
  * resend, cancel, preview templates

---

## Recommended MVP-first “blueprint” (so you don’t rewrite)

If you want the cleanest path: **build Phase 1 UI + APIs**, but structure backend like **Phase 2-lite**:

1. When something happens → write a `NotificationEvent`
2. A simple worker (could even be a cron/interval in the same app at first) reads new events → writes `Notification` rows

It’s only slightly more work than fully synchronous MVP, but it pays off immediately when volume grows.

---

## Concrete module boundaries (works from Phase 1 → Phase 6)

| Module                  | Responsibility                             |
| ----------------------- | ------------------------------------------ |
| **notification-events** | Record what happened (append-only)         |
| **recipient-resolver**  | Who should get it?                         |
| **preference-engine**   | Should they get it / which channels?       |
| **renderer**            | Templates per type/channel                 |
| **deliveries**          | Send + retry + track status                |
| **inbox**               | In-app notifications querying/marking read |

---

## Next steps (to be filled when implementing)

When implementing, capture:

* **Stack:** Nest.js? Queue choice?
* **Channels needed soon:** In-app only? Email next?
* **Targeting:** Can notifications target “many users” (e.g., followers / course students)?

Then map this plan into:

* Concrete DB schema
* Module folder structure
* Job flow you can drop into the codebase
