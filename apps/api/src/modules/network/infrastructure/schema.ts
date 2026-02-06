import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Network module schema
 *
 * Includes:
 * - Case providers (insurers / TPAs)
 * - Medical providers (hospitals / clinics / etc.)
 */

export const caseProviders = pgTable(
  'case_providers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyName: text('company_name').notNull(),
    providerType: text('provider_type').notNull(), // internal | external | TPA
    operatingRegions: text('operating_regions').array().notNull().default([]),
    primaryEmail: text('primary_email').notNull(),
    primaryPhone: text('primary_phone').notNull(),
    status: text('status').notNull().default('active'), // active | inactive
    contractStartDate: timestamp('contract_start_date', { withTimezone: true }),
    contractEndDate: timestamp('contract_end_date', { withTimezone: true }),
    pricingModel: text('pricing_model'),
    slaTier: text('sla_tier'),
    tags: text('tags').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    companyNameIdx: index('idx_case_providers_company_name').on(t.companyName),
    providerTypeIdx: index('idx_case_providers_provider_type').on(
      t.providerType,
    ),
    statusIdx: index('idx_case_providers_status').on(t.status),
    createdAtIdx: index('idx_case_providers_created_at').on(t.createdAt),
  }),
);

export const medicalProviders = pgTable(
  'medical_providers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legalName: text('legal_name').notNull(),
    providerType: text('provider_type').notNull(), // hospital | clinic | lab | pharmacy | doctor
    country: text('country').notNull(),
    primaryEmail: text('primary_email').notNull(),
    primaryPhone: text('primary_phone').notNull(),
    status: text('status').notNull().default('active'), // active | inactive
    specialties: text('specialties').array().notNull().default([]),
    services: text('services').array().notNull().default([]),
    businessHours: text('business_hours'),
    licenseNumber: text('license_number'),
    tags: text('tags').array().notNull().default([]),
    onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    legalNameIdx: index('idx_medical_providers_legal_name').on(t.legalName),
    providerTypeIdx: index('idx_medical_providers_provider_type').on(
      t.providerType,
    ),
    statusIdx: index('idx_medical_providers_status').on(t.status),
    countryIdx: index('idx_medical_providers_country').on(t.country),
    createdAtIdx: index('idx_medical_providers_created_at').on(t.createdAt),
  }),
);

