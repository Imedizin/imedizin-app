import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { reset, seed } from 'drizzle-seed';
import {
  domains,
  emailAttachments,
  emailParticipants,
  emails,
  mailboxes,
  mailboxSubscriptions,
} from '../src/modules/mailbox/infrastructure/schema';
import {
  caseProviders,
  medicalProviders,
} from '../src/modules/network/infrastructure/schema';

const schema = {
  domains,
  mailboxes,
  emails,
  emailParticipants,
  emailAttachments,
  mailboxSubscriptions,
  caseProviders,
  medicalProviders,
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in environment');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  const db = drizzle(pool);

  try {
    console.log('🧹 Resetting database...');
    await reset(db, schema);

    console.log('🌐 Seeding domains...');
    // Seed domains with specific domain names - using direct insert to ensure correct mapping
    const domainData = [{ domain: 'imedizin.com', name: 'Imedizin Egypt' }];

    await db.insert(domains).values(domainData);

    // Get the seeded domains to use their IDs
    const seededDomains = await db.select().from(domains);

    console.log('🌱 Seeding mailboxes...');
    // Seed mailboxes with specific addresses - using direct insert to ensure correct mapping
    const mailboxData = [
      { address: 'support@imedizin.com', name: 'Imedizin Support' },
      { address: 'abdullahomar@imedizin.com', name: 'Abdullah Omar' },
    ];

    await db.insert(mailboxes).values(mailboxData);

    // Get the seeded mailboxes to use their IDs
    const seededMailboxes = await db.select().from(mailboxes);

    console.log('✉️  Seeding emails...');
    // Seed emails - using drizzle-seed for basic fields
    // Use uuid for messageId to ensure uniqueness
    await seed(db, { emails }, { count: 20, seed: 12345 }).refine((f) => ({
      emails: {
        columns: {
          mailboxId: f.valuesFromArray({
            values: seededMailboxes.map((mb) => mb.id),
          }),
          messageId: f.uuid(),
          threadId: f.uuid(),
          subject: f.loremIpsum(),
          bodyText: f.loremIpsum(),
          bodyHtml: f.loremIpsum(),
          rawSource: f.loremIpsum(),
          direction: f.valuesFromArray({
            values: ['incoming', 'outgoing'],
          }),
          sentAt: f.datetime(),
          receivedAt: f.datetime(),
        },
      },
    }));

    // Get seeded emails to create participants and attachments
    const seededEmails = await db.select().from(emails);

    console.log('👥 Seeding email participants...');
    // Seed participants for each email (2-5 per email)
    await seed(
      db,
      { emailParticipants },
      {
        count: seededEmails.length * 3, // Average 3 participants per email
        seed: 12345,
      },
    ).refine((f) => ({
      emailParticipants: {
        columns: {
          emailId: f.valuesFromArray({
            values: seededEmails.map((e) => e.id),
          }),
          emailAddress: f.email(),
          displayName: f.fullName(),
          type: f.valuesFromArray({
            values: ['from', 'to', 'cc', 'bcc', 'reply_to'],
          }),
        },
      },
    }));

    console.log('📎 Seeding email attachments...');
    // Seed attachments for about 30% of emails
    const emailsWithAttachments = seededEmails.slice(
      0,
      Math.floor(seededEmails.length * 0.3),
    );

    if (emailsWithAttachments.length > 0) {
      await seed(
        db,
        { emailAttachments },
        { count: emailsWithAttachments.length, seed: 12345 },
      ).refine((f) => ({
        emailAttachments: {
          columns: {
            emailId: f.valuesFromArray({
              values: emailsWithAttachments.map((e) => e.id),
            }),
            filename: f.valuesFromArray({
              values: [
                'document.pdf',
                'image.png',
                'spreadsheet.xlsx',
                'presentation.pptx',
                'screenshot.jpg',
                'report.docx',
              ],
            }),
            mimeType: f.valuesFromArray({
              values: [
                'application/pdf',
                'image/png',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'image/jpeg',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              ],
            }),
            size: f.int({ minValue: 1024, maxValue: 10485760 }), // 1KB to 10MB
            fileUrl: f.uuid(), // Seed placeholder; real links set by app
            isInline: f.boolean(),
          },
        },
      }));
    }

    const seededParticipants = await db.select().from(emailParticipants);
    const seededAttachments = await db.select().from(emailAttachments);

    console.log('🏥 Seeding medical providers...');
    const medicalProviderData = [
      {
        legalName: 'Cairo University Hospitals',
        providerType: 'hospital',
        country: 'Egypt',
        primaryEmail: 'contact@cuh.eg',
        primaryPhone: '+20 2 2365 2000',
        status: 'active',
        specialties: ['General', 'Cardiology', 'Emergency medicine', 'I.C.U'],
        services: ['Inpatient care', 'Emergency', 'Surgery', 'ICU'],
        businessHours: '24/7',
        licenseNumber: 'EG-H-001',
        tags: ['university', 'tertiary'],
      },
      {
        legalName: 'Saudi German Hospital Cairo',
        providerType: 'hospital',
        country: 'Egypt',
        primaryEmail: 'info@sgh-cairo.com',
        primaryPhone: '+20 2 2537 0000',
        status: 'active',
        specialties: ['General', 'Medical Oncology', 'Transplantation', 'C.C.U'],
        services: ['Oncology', 'Transplant', 'Cardiac care'],
        businessHours: '24/7',
        licenseNumber: 'EG-H-002',
        tags: ['private', 'tertiary'],
      },
      {
        legalName: 'Andalusia Medical Center',
        providerType: 'clinic',
        country: 'Egypt',
        primaryEmail: 'reception@andalusia-group.com',
        primaryPhone: '+20 2 2536 1000',
        status: 'active',
        specialties: ['General Practitioner', 'Dermatology', 'Radiology'],
        services: ['Outpatient', 'Imaging', 'Lab'],
        businessHours: 'Sat-Thu 9:00-21:00',
        tags: ['outpatient'],
      },
      {
        legalName: 'Al Borg Labs',
        providerType: 'lab',
        country: 'Egypt',
        primaryEmail: 'support@alborglabs.com',
        primaryPhone: '+20 2 2342 5000',
        status: 'active',
        specialties: ['Clinical Pathology'],
        services: ['Blood tests', 'Pathology', 'Molecular diagnostics'],
        businessHours: 'Sat-Thu 7:00-22:00',
        licenseNumber: 'EG-L-001',
        tags: ['diagnostics'],
      },
      {
        legalName: 'Integrated Diagnostics Holdings',
        providerType: 'lab',
        country: 'Egypt',
        primaryEmail: 'info@idh.com.eg',
        primaryPhone: '+20 2 2343 0000',
        status: 'active',
        specialties: ['Clinical Pathology', 'Radiology'],
        services: ['Lab', 'Radiology', 'Home collection'],
        businessHours: 'Sat-Thu 8:00-20:00',
        tags: ['diagnostics', 'radiology'],
      },
      {
        legalName: 'El Ezaby Pharmacy',
        providerType: 'pharmacy',
        country: 'Egypt',
        primaryEmail: 'contact@ezabypharmacy.com',
        primaryPhone: '+20 2 2524 0000',
        status: 'active',
        services: ['Dispensing', 'OTC', 'Chronic medications'],
        businessHours: '24/7 (selected branches)',
        tags: ['retail', 'chain'],
      },
      {
        legalName: 'Dr. Ahmed Hassan – Cardiology',
        providerType: 'doctor',
        country: 'Egypt',
        primaryEmail: 'dr.ahmed.hassan@clinic.eg',
        primaryPhone: '+20 100 123 4567',
        status: 'active',
        specialties: ['Cardiology', 'C.C.U'],
        services: ['Consultation', 'Echo', 'Stress test'],
        businessHours: 'Sun-Thu 10:00-16:00',
        licenseNumber: 'EG-MD-001',
        tags: ['consultant'],
      },
      {
        legalName: 'Dr. Sara Mahmoud – Dermatology',
        providerType: 'doctor',
        country: 'Egypt',
        primaryEmail: 'dr.sara.mahmoud@clinic.eg',
        primaryPhone: '+20 101 234 5678',
        status: 'active',
        specialties: ['Dermatology'],
        services: ['Consultation', 'Procedures'],
        businessHours: 'Sat-Wed 11:00-19:00',
        tags: ['consultant'],
      },
    ];
    await db.insert(medicalProviders).values(medicalProviderData);
    const seededMedicalProviders = await db.select().from(medicalProviders);

    console.log('📋 Seeding case providers...');
    const caseProviderData = [
      {
        companyName: 'Imedizin Internal Network',
        providerType: 'internal',
        operatingRegions: ['Middle East', 'North Africa', 'Sub-Saharan Africa'],
        primaryEmail: 'network@imedizin.com',
        primaryPhone: '+20 2 2345 6789',
        status: 'active',
        contractStartDate: new Date('2020-01-01'),
        contractEndDate: new Date('2030-12-31'),
        pricingModel: 'capitation',
        slaTier: 'premium',
        tags: ['internal', 'default'],
      },
      {
        companyName: 'Allianz Egypt',
        providerType: 'external',
        operatingRegions: ['Middle East', 'North Africa'],
        primaryEmail: 'health@allianz.eg',
        primaryPhone: '+20 2 2538 1000',
        status: 'active',
        contractStartDate: new Date('2023-01-01'),
        contractEndDate: new Date('2026-12-31'),
        pricingModel: 'fee-for-service',
        slaTier: 'standard',
        tags: ['insurer'],
      },
      {
        companyName: 'MetLife Egypt TPA',
        providerType: 'TPA',
        operatingRegions: ['Middle East', 'North Africa'],
        primaryEmail: 'tpa@metlife.eg',
        primaryPhone: '+20 2 2520 3000',
        status: 'active',
        contractStartDate: new Date('2023-06-01'),
        contractEndDate: new Date('2026-05-31'),
        pricingModel: 'per-claim',
        slaTier: 'standard',
        tags: ['TPA'],
      },
      {
        companyName: 'Bupa Global',
        providerType: 'external',
        operatingRegions: ['Global', 'Middle East'],
        primaryEmail: 'partners@bupaglobal.com',
        primaryPhone: '+44 20 7656 1234',
        status: 'active',
        contractStartDate: new Date('2022-01-01'),
        contractEndDate: new Date('2025-12-31'),
        pricingModel: 'network-rates',
        slaTier: 'premium',
        tags: ['international'],
      },
      {
        companyName: 'AXA Egypt',
        providerType: 'external',
        operatingRegions: ['North Africa', 'Middle East'],
        primaryEmail: 'health.claims@axa.eg',
        primaryPhone: '+20 2 2359 0000',
        status: 'active',
        contractStartDate: new Date('2022-06-01'),
        contractEndDate: new Date('2025-12-31'),
        pricingModel: 'fee-for-service',
        slaTier: 'standard',
        tags: ['insurer'],
      },
      {
        companyName: 'MedNet TPA Services',
        providerType: 'TPA',
        operatingRegions: ['Middle East', 'Asia Pacific'],
        primaryEmail: 'info@mednet-tpa.com',
        primaryPhone: '+20 2 2340 5000',
        status: 'active',
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2027-12-31'),
        pricingModel: 'per-claim',
        slaTier: 'standard',
        tags: ['TPA', 'regional'],
      },
    ];
    await db.insert(caseProviders).values(caseProviderData);
    const seededCaseProviders = await db.select().from(caseProviders);

    console.log('✅ Seeding completed successfully!');
    console.log(`📊 Seeded:`);
    console.log(`   - ${seededDomains.length} domains`);
    console.log(`   - ${seededMailboxes.length} mailboxes`);
    console.log(`   - ${seededEmails.length} emails`);
    console.log(`   - ${seededParticipants.length} email participants`);
    console.log(`   - ${seededAttachments.length} email attachments`);
    console.log(`   - ${seededMedicalProviders.length} medical providers`);
    console.log(`   - ${seededCaseProviders.length} case providers`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
