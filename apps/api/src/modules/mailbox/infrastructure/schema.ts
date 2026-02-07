import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Email direction enum
 * Defines whether an email is incoming or outgoing
 */
export const emailDirectionEnum = pgEnum("email_direction", [
  "incoming",
  "outgoing",
]);

/**
 * Email participant type enum
 * Defines the role of a participant in an email
 */
export const emailParticipantTypeEnum = pgEnum("email_participant_type", [
  "from",
  "to",
  "cc",
  "bcc",
  "reply_to",
]);

/**
 * Domains table schema
 * Represents email domains like ourdomain.com
 * Responsibilities:
 * - Domain ownership
 * - Domain-level settings
 * - Future: Multi-tenant support
 */
export const domains = pgTable(
  "domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domain: text("domain").notNull().unique(), // Domain name (e.g., ourdomain.com)
    name: text("name").notNull(), // Display name (e.g., Our Company Domain)
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    domainIdx: index("idx_domains_domain").on(t.domain),
  }),
);

/**
 * Mailbox subscriptions table schema
 * Stores Microsoft Graph webhook subscriptions
 */
export const mailboxSubscriptions = pgTable(
  "mailbox_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subscriptionId: text("subscription_id").notNull().unique(), // Microsoft Graph subscription ID
    mailboxId: text("mailbox_id").notNull(), // Mailbox identifier (email or GUID)
    resource: text("resource").notNull(), // e.g., /users/{mailboxId}/messages
    notificationUrl: text("notification_url").notNull(),
    changeType: text("change_type")
      .notNull()
      .default("created,updated,deleted"),
    clientState: text("client_state"), // Optional client state for validation
    expirationDateTime: timestamp("expiration_date_time", {
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    subscriptionIdIdx: index("idx_mailbox_subscriptions_subscription_id").on(
      t.subscriptionId,
    ),
    mailboxIdIdx: index("idx_mailbox_subscriptions_mailbox_id").on(t.mailboxId),
    expirationIdx: index("idx_mailbox_subscriptions_expiration").on(
      t.expirationDateTime,
    ),
    mailboxResourceUq: uniqueIndex(
      "uq_mailbox_subscriptions_mailbox_resource",
    ).on(t.mailboxId, t.resource),
  }),
);

/**
 * Mailboxes table schema
 * Represents inboxes like support@ourdomain.com
 * Responsibilities:
 * - Routing incoming emails
 * - Ownership boundary
 * - Delta sync tracking
 * - Permissions later
 */
export const mailboxes = pgTable(
  "mailboxes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    address: text("address").notNull().unique(), // Full email address (e.g., support@ourdomain.com)
    name: text("name").notNull(), // Display name (e.g., Support, HR)
    deltaLink: text("delta_link"), // Microsoft Graph delta link for incremental sync
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }), // When mailbox was last synced
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    addressIdx: index("idx_mailboxes_address").on(t.address),
  }),
);

/**
 * Emails table schema
 * Core email storage - emails are immutable after ingestion
 * Responsibilities:
 * - Store immutable email content
 * - Track direction and timestamps
 * - Link to mailbox
 * - Support RFC-compliant threading via In-Reply-To and References headers
 */
export const emails = pgTable(
  "emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mailboxId: uuid("mailbox_id")
      .notNull()
      .references(() => mailboxes.id, { onDelete: "cascade" }),
    messageId: text("message_id").notNull(), // RFC Message-ID header (mandatory, used for deduplication)
    threadId: text("thread_id"), // Computed thread ID for grouping conversations
    inReplyTo: text("in_reply_to"), // RFC In-Reply-To header - Message-ID of parent email
    references: text("references"), // RFC References header - space-separated list of ancestor Message-IDs
    subject: text("subject").notNull(),
    bodyText: text("body_text"), // Plain text body
    bodyHtml: text("body_html"), // HTML body
    rawSource: text("raw_source").notNull(), // Full raw RFC email source (always stored)
    direction: emailDirectionEnum("direction").notNull(), // 'incoming' | 'outgoing'
    sentAt: timestamp("sent_at", { withTimezone: true }), // When email was sent
    receivedAt: timestamp("received_at", { withTimezone: true }), // When email was received
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    mailboxIdIdx: index("idx_emails_mailbox_id").on(t.mailboxId),
    messageIdIdx: uniqueIndex("idx_emails_message_id").on(t.messageId), // Unique for deduplication
    threadIdIdx: index("idx_emails_thread_id").on(t.threadId), // For threading queries
    inReplyToIdx: index("idx_emails_in_reply_to").on(t.inReplyTo), // For finding parent emails
    directionIdx: index("idx_emails_direction").on(t.direction),
    sentAtIdx: index("idx_emails_sent_at").on(t.sentAt),
    receivedAtIdx: index("idx_emails_received_at").on(t.receivedAt),
  }),
);

/**
 * Email participants table schema
 * Stores email participants separately to keep structure clean
 * Participants include: from, to, cc, bcc, reply_to
 */
export const emailParticipants = pgTable(
  "email_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    emailId: uuid("email_id")
      .notNull()
      .references(() => emails.id, { onDelete: "cascade" }),
    emailAddress: text("email_address").notNull(), // Email address
    displayName: text("display_name"), // Display name (optional)
    type: emailParticipantTypeEnum("type").notNull(), // 'from' | 'to' | 'cc' | 'bcc' | 'reply_to'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdIdx: index("idx_email_participants_email_id").on(t.emailId),
    emailAddressIdx: index("idx_email_participants_email_address").on(
      t.emailAddress,
    ),
    typeIdx: index("idx_email_participants_type").on(t.type),
  }),
);

/**
 * Email attachments table schema
 * Stores attachment metadata separately from emails
 * file_url = direct public link (e.g. {APP_PUBLIC_URL}/attachments/{mailboxId}/{emailId}/{filename})
 * Files are stored in ATTACHMENTS_PATH and served as a static bucket at /attachments
 */
export const emailAttachments = pgTable(
  "email_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    emailId: uuid("email_id")
      .notNull()
      .references(() => emails.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(), // Original filename
    mimeType: text("mime_type").notNull(), // MIME type (e.g., application/pdf)
    size: integer("size").notNull(), // Size in bytes
    fileUrl: text("file_url").notNull(), // Direct public URL (bucket-style)
    isInline: boolean("is_inline").notNull().default(false), // Whether attachment is inline
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailIdIdx: index("idx_email_attachments_email_id").on(t.emailId),
    fileUrlIdx: index("idx_email_attachments_file_url").on(t.fileUrl),
  }),
);
