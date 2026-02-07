import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Notifications table – persisted inbox per recipient (e.g. mailbox/mailboxId).
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientType: text("recipient_type").notNull(),
    recipientId: text("recipient_id").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    data: jsonb("data"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    recipientIdx: index("idx_notifications_recipient").on(
      t.recipientType,
      t.recipientId,
    ),
    createdAtIdx: index("idx_notifications_created_at").on(t.createdAt),
  }),
);
