import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Transportation requests table schema
 * Phase 1: Minimal schema with just pickup/dropoff addresses
 */
export const transportationRequests = pgTable(
  'transportation_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    requestNumber: text('request_number').notNull().unique(),
    pickupAddress: text('pickup_address').notNull(),
    dropoffAddress: text('dropoff_address').notNull(),
    threadIds: text('thread_ids').array(), // Microsoft Graph conversation/thread IDs (opaque strings)
    status: text('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    requestNumberIdx: index('idx_transportation_requests_request_number').on(
      t.requestNumber,
    ),
    statusIdx: index('idx_transportation_requests_status').on(t.status),
    createdAtIdx: index('idx_transportation_requests_created_at').on(
      t.createdAt,
    ),
    threadIdsIdx: index('idx_transportation_requests_thread_id').on(
      t.threadIds,
    ),
  }),
);
