import {
  boolean,
  date,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const serviceTypeEnum = pgEnum('assistance_service_type', [
  'TRANSPORT',
  'MEDICAL',
]);

export const modeOfTransportEnum = pgEnum('mode_of_transport', [
  'lemozen',
  'als',
  'bls',
]);

/**
 * Parent table: shared fields for all assistance requests (TRANSPORT + MEDICAL).
 * Patient info lives on the parent.
 */
export const assistanceRequests = pgTable(
  'assistance_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    requestNumber: text('request_number').notNull().unique(),
    serviceType: serviceTypeEnum('service_type').notNull(),
    status: text('status').notNull().default('NEW'),
    priority: text('priority'),
    providerReferenceNumber: text('provider_reference_number'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
    caseProviderId: uuid('case_provider_id'),
    patientFullName: text('patient_full_name').notNull(),
    patientBirthDate: date('patient_birth_date', { mode: 'string' }),
    patientNationalityCode: text('patient_nationality_code'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    serviceTypeIdx: index('idx_assistance_requests_service_type').on(
      t.serviceType,
    ),
    statusIdx: index('idx_assistance_requests_status').on(t.status),
    providerRefIdx: index('idx_assistance_requests_provider_reference_number').on(
      t.providerReferenceNumber,
    ),
    receivedAtIdx: index('idx_assistance_requests_received_at').on(t.receivedAt),
    createdAtIdx: index('idx_assistance_requests_created_at').on(t.createdAt),
  }),
);

/**
 * Child table: transport-specific fields (1:1 with parent when service_type = TRANSPORT).
 */
export const transportRequests = pgTable('transport_requests', {
  requestId: uuid('request_id')
    .primaryKey()
    .references(() => assistanceRequests.id, { onDelete: 'cascade' }),
  pickupPoint: text('pickup_point').notNull(),
  dropoffPoint: text('dropoff_point').notNull(),
  requestedTransportAt: timestamp('requested_transport_at', {
    withTimezone: true,
  }),
  modeOfTransport: modeOfTransportEnum('mode_of_transport'),
  medicalCrewRequired: boolean('medical_crew_required').notNull().default(false),
  hasCompanion: boolean('has_companion').notNull().default(false),
  estimatedPickupTime: timestamp('estimated_pickup_time', {
    withTimezone: true,
  }),
  estimatedDropoffTime: timestamp('estimated_dropoff_time', {
    withTimezone: true,
  }),
  diagnosis: text('diagnosis'),
});

/**
 * Child table: medical-case-specific fields (1:1 with parent when service_type = MEDICAL).
 */
export const medicalRequests = pgTable('medical_requests', {
  requestId: uuid('request_id')
    .primaryKey()
    .references(() => assistanceRequests.id, { onDelete: 'cascade' }),
  caseProviderReferenceNumber: text('case_provider_reference_number'),
  admissionDate: date('admission_date', { mode: 'string' }),
  dischargeDate: date('discharge_date', { mode: 'string' }),
  country: text('country'),
  city: text('city'),
  medicalProviderId: uuid('medical_provider_id'),
  diagnosis: text('diagnosis'),
});

/**
 * Junction table: link assistance requests to mail threads (by thread_id string).
 * No FK to mailbox module — thread_id is opaque; mailbox module owns thread semantics.
 */
export const assistanceRequestThreads = pgTable(
  'assistance_request_threads',
  {
    assistanceRequestId: uuid('assistance_request_id')
      .notNull()
      .references(() => assistanceRequests.id, { onDelete: 'cascade' }),
    threadId: text('thread_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.assistanceRequestId, t.threadId] }),
    requestIdx: index('idx_assistance_request_threads_request_id').on(
      t.assistanceRequestId,
    ),
  }),
);
