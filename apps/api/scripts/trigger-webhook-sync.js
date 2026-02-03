#!/usr/bin/env node
/**
 * Trigger the webhook sync flow by simulating a Microsoft Graph notification.
 * Use this after sending a real email to the mailbox to trigger delta sync
 * without waiting for Graph to POST the webhook.
 *
 * Prerequisites:
 * 1. Send a real email TO the mailbox (e.g. support@imedizin.com).
 * 2. Backend running (default http://localhost:3000).
 *
 * Env (optional):
 *   BACKEND_URL   - e.g. http://localhost:3000 or https://your-tunnel/mailbox
 *   MAILBOX_ID   - UUID of the mailbox (default: from first subscription)
 *   WEBHOOK_CLIENT_STATE - must match backend .env (default: my-super-secret)
 *
 * Usage:
 *   node scripts/trigger-webhook-sync.js
 *   MAILBOX_ID=8292a24c-a921-4f8b-b145-9ea7ed246e1f node scripts/trigger-webhook-sync.js
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const MAILBOX_ADDRESS = process.env.MAILBOX_ADDRESS || 'support@imedizin.com';
// MAILBOX_ID can be UUID or email (e.g. support@imedizin.com); if email, we resolve to UUID
const MAILBOX_ID = process.env.MAILBOX_ID;
const WEBHOOK_CLIENT_STATE = process.env.WEBHOOK_CLIENT_STATE || 'my-super-secret';

function isEmail(value) {
  return typeof value === 'string' && value.includes('@');
}

async function resolveMailboxId(mailboxIdOrAddress) {
  if (!mailboxIdOrAddress) return null;
  if (!isEmail(mailboxIdOrAddress)) return mailboxIdOrAddress; // already a UUID
  const mailboxesRes = await fetch(`${BACKEND_URL}/api/mailboxes`);
  if (!mailboxesRes.ok) {
    console.error('Failed to fetch mailboxes:', mailboxesRes.status, await mailboxesRes.text());
    process.exit(1);
  }
  const { data: mailboxes } = await mailboxesRes.json();
  const mailbox = mailboxes?.find(
    (m) => (m.address || m.email || '').toLowerCase() === mailboxIdOrAddress.toLowerCase(),
  );
  if (!mailbox) {
    console.error('Mailbox not found:', mailboxIdOrAddress);
    process.exit(1);
  }
  return mailbox.id;
}

async function main() {
  const mailboxIdOrAddress = MAILBOX_ID || MAILBOX_ADDRESS;
  const mailboxAddress = isEmail(mailboxIdOrAddress) ? mailboxIdOrAddress : MAILBOX_ADDRESS;

  let mailboxId = await resolveMailboxId(mailboxIdOrAddress);
  if (!mailboxId) {
    mailboxId = await resolveMailboxId(MAILBOX_ADDRESS);
  }
  if (isEmail(mailboxIdOrAddress)) {
    console.log('Resolved mailbox', mailboxIdOrAddress, '-> id:', mailboxId);
  }

  // Backend may store mailbox_id as email (e.g. support@imedizin.com); use same key for subscriptions API
  const subscriptionsKey = isEmail(mailboxIdOrAddress) ? mailboxIdOrAddress : mailboxId;
  console.log('Fetching subscriptions for mailbox:', subscriptionsKey);
  const listRes = await fetch(
    `${BACKEND_URL}/api/subscriptions/mailbox/${encodeURIComponent(subscriptionsKey)}`,
  );
  if (!listRes.ok) {
    console.error('Failed to fetch subscriptions:', listRes.status, await listRes.text());
    process.exit(1);
  }
  const { data: subscriptions } = await listRes.json();
  if (!subscriptions?.length) {
    console.error('No subscriptions found for this mailbox. Create a subscription first.');
    process.exit(1);
  }
  const sub = subscriptions[0];
  const subscriptionId = sub.subscriptionId || sub.id;
  console.log('Using subscriptionId:', subscriptionId);

  const body = {
    value: [
      {
        subscriptionId,
        changeType: 'created',
        resource: `users/${mailboxAddress}/mailFolders/inbox/messages`,
        clientState: WEBHOOK_CLIENT_STATE,
        subscriptionExpirationDateTime: new Date(Date.now() + 3600000).toISOString(),
        tenantId: '00000000-0000-0000-0000-000000000000',
      },
    ],
  };

  console.log('POSTing simulated webhook to', `${BACKEND_URL}/mailbox/webhooks/graph`);
  const webhookRes = await fetch(`${BACKEND_URL}/mailbox/webhooks/graph`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (webhookRes.status !== 202) {
    console.error('Webhook returned', webhookRes.status, await webhookRes.text());
    process.exit(1);
  }
  const json = await webhookRes.json();
  console.log('Webhook accepted:', json);
  console.log('Check backend logs for "Delta sync" and new email processing.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
