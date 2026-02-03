# Email Module – Design Decisions (Single Domain, Future‑Proof)

## Purpose

This document captures the **agreed design decisions** for the email module as of now.
The goal is to:

* Start **simple** (one domain)
* Make the system the **source of truth** for emails
* Stay **future‑proof** for adding multiple domains later

This is a **living design baseline**.

---

## Current Scope (What We Support Now)

* One domain (e.g. `ourdomain.com`)
* Multiple mailboxes under the domain:

  * `support@ourdomain.com`
  * `hr@ourdomain.com`
  * `info@ourdomain.com`
* Incoming and outgoing emails
* Centralized storage (DB is the source of truth)

We **do not** support multiple domains yet, but we design for it.

---

## Core Design Principles

### 1. System Is the Source of Truth

* Every email is stored **once** in our DB
* External providers (SMTP, IMAP, Gmail, Outlook) are **sources**, not authorities
* Emails are **immutable** after ingestion

---

### 2. Emails Belong to Mailboxes

**Key rule:**

> An email always belongs to a mailbox, never directly to a domain.

This rule enables painless scaling later.

Hierarchy:

```
Mailbox → Emails
```

Later:

```
Domain → Mailboxes → Emails
```

---

### 3. Raw Email Is Always Stored

We **always** store:

* Full raw RFC email source

Reason:

* Reprocessing
* Debugging
* Legal / compliance
* Provider inconsistencies

If we can only store one thing forever → **raw email wins**.

---

### 4. Message‑ID Is Sacred

* `message_id` (RFC header) is mandatory
* Used for:

  * Deduplication
  * Threading
  * Provider sync consistency

Never generate or override it.

---

## Database Design (Current – Single Domain)

### Mailboxes Table

Represents inboxes like `support@ourdomain.com`.

**Responsibilities:**

* Routing incoming emails
* Ownership boundary
* Permissions later

Fields:

* `id` (UUID, PK)
* `address` (full email address)
* `name` (display name: Support, HR)
* `created_at`

---

### Emails Table

Core email storage.

**Responsibilities:**

* Store immutable email content
* Track direction and timestamps
* Link to mailbox

Key fields:

* `id` (UUID, PK)
* `mailbox_id` (FK → mailboxes)
* `message_id`
* `thread_id` (internal conversation id)
* `subject`
* `body_text`
* `body_html`
* `raw_source`
* `direction` (`incoming` | `outgoing`)
* `sent_at`
* `received_at`
* `created_at`

Rules:

* Email content is never updated
* Flags can change, content cannot

---

### Email Participants

Stored separately to keep structure clean.

Participants include:

* from
* to
* cc
* bcc
* reply_to

Each participant has:

* email address
* display name
* type

This avoids string parsing and supports future contact linking.

---

### Attachments

Attachments are stored separately from emails.

Stored data:

* filename
* mime type
* size
* storage location (S3 / disk)
* inline flag

Emails only reference attachments.

---

## What We Explicitly Do NOT Do (Yet)

* No multi‑domain logic
* No tenants table
* No billing / plans
* No per‑domain retention rules
* No user permissions

This is intentional.

---

## Future: Adding Multiple Domains (Planned & Safe)

When we want to support:

* `client1.com`
* `client2.org`

We **do NOT touch emails**.

### Step 1: Add Domains Table

New table:

* `domains`

  * `id`
  * `domain` (unique)

---

### Step 2: Link Mailboxes to Domains

Add one column:

* `mailboxes.domain_id`

New hierarchy:

```
Domain → Mailboxes → Emails
```

---

### Step 3: Migrate Existing Data

* Insert `ourdomain.com` into `domains`
* Assign all existing mailboxes to it
* Done

No email migration required.

---

## Why This Design Works

* Zero refactor when scaling
* Clear ownership boundaries
* Secure by default
* Matches real email systems (Gmail, Zendesk, HelpScout)
* Easy to reason about

---

## Non‑Negotiable Rules (Final)

1. Emails are immutable
2. Raw email is always stored
3. Emails belong to mailboxes
4. Mailboxes will belong to domains (later)
5. Message‑ID is trusted over everything else

---

## Next Design Topics (Not Yet Decided)

* Incoming email ingestion flow (SMTP / webhook)
* Mailbox resolution rules
* Threading algorithm (RFC compliant)
* Outgoing email tracking
* Permissions & roles

---

**This document reflects all decisions agreed so far.**
