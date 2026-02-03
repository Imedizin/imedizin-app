/**
 * Script to reprocess existing emails and populate threading fields
 * (inReplyTo, references, threadId) from rawSource
 *
 * Run with: npx ts-node scripts/reprocess-threads.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { emails } from '../src/modules/mailbox/infrastructure/schema';
import { eq, isNull, or } from 'drizzle-orm';

// Threading header parser (same logic as ThreadingService)
function parseThreadingHeaders(rawSource: string) {
  if (!rawSource) {
    return { messageId: null, inReplyTo: null, references: null };
  }

  // Split headers from body (headers end at first empty line)
  const headerSection = rawSource.split(/\r?\n\r?\n/)[0] || '';

  // Unfold headers (RFC 5322: long headers can be folded with CRLF + whitespace)
  const unfoldedHeaders = headerSection.replace(/\r?\n[ \t]+/g, ' ');

  return {
    messageId: extractHeader(unfoldedHeaders, 'Message-ID'),
    inReplyTo: extractHeader(unfoldedHeaders, 'In-Reply-To'),
    references: extractReferences(unfoldedHeaders),
  };
}

function extractHeader(headers: string, name: string): string | null {
  const regex = new RegExp(`^${name}:\\s*<?([^>\\r\\n]+)>?`, 'mi');
  const match = headers.match(regex);

  if (match && match[1]) {
    return match[1].trim().replace(/^<|>$/g, '');
  }

  return null;
}

function extractReferences(headers: string): string | null {
  const regex = /^References:\s*(.+)$/im;
  const match = headers.match(regex);

  if (match && match[1]) {
    const messageIds = match[1].match(/<[^>]+>/g);
    if (messageIds) {
      return messageIds.map((id) => id.replace(/^<|>$/g, '')).join(' ');
    }
    return match[1].trim();
  }

  return null;
}

async function main() {
  console.log('Starting thread reprocessing...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    // Get all emails that need reprocessing
    // (have rawSource but missing threading fields)
    const emailsToProcess = await db
      .select({
        id: emails.id,
        messageId: emails.messageId,
        rawSource: emails.rawSource,
        threadId: emails.threadId,
      })
      .from(emails);

    console.log(`Found ${emailsToProcess.length} emails to process`);

    let processed = 0;
    let updated = 0;
    const emailMap = new Map<string, string>(); // messageId -> threadId

    // First pass: parse headers and build message ID map
    const parsedEmails: Array<{
      id: string;
      messageId: string;
      inReplyTo: string | null;
      references: string | null;
      existingThreadId: string | null;
    }> = [];

    for (const email of emailsToProcess) {
      if (!email.rawSource) {
        continue;
      }

      const headers = parseThreadingHeaders(email.rawSource);
      parsedEmails.push({
        id: email.id,
        messageId: email.messageId,
        inReplyTo: headers.inReplyTo,
        references: headers.references,
        existingThreadId: email.threadId,
      });
    }

    // Second pass: compute thread IDs
    for (const email of parsedEmails) {
      let threadId: string | null = null;

      // Strategy 1: Check if we already have this message's thread
      if (email.existingThreadId) {
        threadId = email.existingThreadId;
      }

      // Strategy 2: Try to find parent via In-Reply-To
      if (!threadId && email.inReplyTo) {
        const parentThreadId = emailMap.get(email.inReplyTo);
        if (parentThreadId) {
          threadId = parentThreadId;
        }
      }

      // Strategy 3: Try References
      if (!threadId && email.references) {
        const refIds = email.references.split(/\s+/);
        for (const refId of refIds.reverse()) {
          const ancestorThreadId = emailMap.get(refId);
          if (ancestorThreadId) {
            threadId = ancestorThreadId;
            break;
          }
        }
      }

      // Strategy 4: Use this email's messageId as new thread
      if (!threadId) {
        threadId = email.messageId;
      }

      // Store in map for later lookups
      emailMap.set(email.messageId, threadId);

      // Update the email
      await db
        .update(emails)
        .set({
          inReplyTo: email.inReplyTo,
          references: email.references,
          threadId: threadId,
        })
        .where(eq(emails.id, email.id));

      processed++;
      if (email.inReplyTo || email.references) {
        updated++;
      }

      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${emailsToProcess.length} emails`);
      }
    }

    console.log(`\nReprocessing complete!`);
    console.log(`Total processed: ${processed}`);
    console.log(`Emails with threading info: ${updated}`);
  } catch (error) {
    console.error('Error during reprocessing:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
