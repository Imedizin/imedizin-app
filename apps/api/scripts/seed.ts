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

const schema = {
  domains,
  mailboxes,
  emails,
  emailParticipants,
  emailAttachments,
  mailboxSubscriptions,
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

    console.log('✅ Seeding completed successfully!');
    console.log(`📊 Seeded:`);
    console.log(`   - ${seededDomains.length} domains`);
    console.log(`   - ${seededMailboxes.length} mailboxes`);
    console.log(`   - ${seededEmails.length} emails`);
    console.log(`   - ${seededParticipants.length} email participants`);
    console.log(`   - ${seededAttachments.length} email attachments`);
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
