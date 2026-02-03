import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getQueueToken } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { AppModule } from '../src/app.module';
import { NEW_MESSAGE_QUEUE } from '../src/modules/mailbox/application/processors/new-message.processor';
import { MailboxSubscription } from '../src/modules/mailbox/domain/entities/mailbox-subscription.entity';
import type { IMailboxRepository } from '../src/modules/mailbox/domain/interfaces/mailbox.repository.interface';
import type { IMailboxSubscriptionRepository } from '../src/modules/mailbox/domain/interfaces/mailbox-subscription.repository.interface';

const DEFAULT_CLIENT_STATE = 'my-super-secret';

function notificationChange(
  overrides: {
    subscriptionId?: string;
    messageId?: string;
    clientState?: string;
    resourceData?: { id: string };
  } = {},
) {
  const subscriptionId = overrides.subscriptionId ?? 'sub-e2e-123';
  const messageId = overrides.messageId ?? 'msg-e2e-456';
  return {
    subscriptionId,
    subscriptionExpirationDateTime: new Date(
      Date.now() + 3600_000,
    ).toISOString(),
    changeType: 'created' as const,
    resource: "users('user')/mailFolders('Inbox')/messages",
    resourceData: overrides.resourceData ?? { id: messageId },
    clientState: overrides.clientState ?? DEFAULT_CLIENT_STATE,
    tenantId: 'tenant-e2e',
  };
}

describe('WebhookController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Subscription validation', () => {
    const validationToken = 'V4fy2abc123xyz';

    it('GET /mailbox/webhooks/graph?validationToken=... returns 200 and token as text/plain', () => {
      return request(app.getHttpServer())
        .get('/mailbox/webhooks/graph')
        .query({ validationToken })
        .expect(200)
        .expect('Content-Type', /text\/plain/)
        .expect(validationToken);
    });

    it('POST /mailbox/webhooks/graph?validationToken=... returns 200 and token as text/plain', () => {
      return request(app.getHttpServer())
        .post('/mailbox/webhooks/graph')
        .query({ validationToken })
        .set('Content-Type', 'text/plain')
        .send('')
        .expect(200)
        .expect('Content-Type', /text\/plain/)
        .expect(validationToken);
    });

    it('GET /mailbox/webhooks/graph without validationToken returns 400', () => {
      return request(app.getHttpServer())
        .get('/mailbox/webhooks/graph')
        .expect(400)
        .expect((res) => {
          const body = res.body as { error?: string };
          expect(body.error).toBeDefined();
        });
    });
  });

  describe('Webhook notification (POST without validationToken)', () => {
    it('POST /mailbox/webhooks/graph with empty value returns 202', () => {
      const notification = { value: [] };

      return request(app.getHttpServer())
        .post('/mailbox/webhooks/graph')
        .set('Content-Type', 'application/json')
        .send(notification)
        .expect(202)
        .expect('Content-Type', /application\/json/)
        .expect((res) => {
          const body = res.body as { success: boolean; message: string };
          expect(body.success).toBe(true);
          expect(typeof body.message).toBe('string');
        });
    });

    it('POST /mailbox/webhooks/graph with one change (valid shape) returns 202', () => {
      const notification = { value: [notificationChange()] };

      return request(app.getHttpServer())
        .post('/mailbox/webhooks/graph')
        .set('Content-Type', 'application/json')
        .send(notification)
        .expect(202)
        .expect('Content-Type', /application\/json/)
        .expect((res) => {
          const body = res.body as { success: boolean; message: string };
          expect(body.success).toBe(true);
        });
    });

    it('POST /mailbox/webhooks/graph with wrong clientState returns 202 (no job enqueued)', () => {
      const notification = {
        value: [notificationChange({ clientState: 'wrong-secret' })],
      };

      return request(app.getHttpServer())
        .post('/mailbox/webhooks/graph')
        .set('Content-Type', 'application/json')
        .send(notification)
        .expect(202);
    });

    it('POST /mailbox/webhooks/graph with missing resourceData.id returns 202', () => {
      const notification = {
        value: [
          {
            ...notificationChange(),
            resourceData: undefined,
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/mailbox/webhooks/graph')
        .set('Content-Type', 'application/json')
        .send(notification)
        .expect(202);
    });

    it('enqueues new-message job when subscription exists (requires Redis)', async () => {
      const mailboxRepo = app.get<IMailboxRepository>('IMailboxRepository');
      const subscriptionRepo = app.get<IMailboxSubscriptionRepository>(
        'IMailboxSubscriptionRepository',
      );
      const queue = app.get<Queue>(getQueueToken(NEW_MESSAGE_QUEUE));

      await queue.obliterate({ force: true });

      const subscriptionId = `sub-e2e-${Date.now()}`;
      const messageId = 'AAMkAGI2THVSAAA';

      const uniqueAddress = `e2e-webhook-${Date.now()}@test.local`;
      const mailbox = await mailboxRepo.create({
        address: uniqueAddress,
        name: 'E2E Webhook Test',
      });
      const mailboxId = mailbox.id;

      const subscription = new MailboxSubscription(
        'uuid-e2e-sub',
        subscriptionId,
        mailboxId,
        "users('user')/mailFolders('Inbox')/messages",
        'https://example.com/webhook',
        new Date(Date.now() + 3600_000),
        DEFAULT_CLIENT_STATE,
      );
      await subscriptionRepo.save(subscription);

      const countsBefore = await queue.getJobCounts();

      const notification = {
        value: [
          notificationChange({
            subscriptionId,
            messageId,
            clientState: DEFAULT_CLIENT_STATE,
          }),
        ],
      };

      await request(app.getHttpServer())
        .post('/mailbox/webhooks/graph')
        .set('Content-Type', 'application/json')
        .send(notification)
        .expect(202);

      const jobId = `${mailboxId}_${messageId}`;
      const job = await pollForJob(queue, jobId, mailboxId, messageId, 15, 150);

      const countsAfter = await queue.getJobCounts();
      const totalBefore =
        (countsBefore.waiting ?? 0) +
        (countsBefore.completed ?? 0) +
        (countsBefore.active ?? 0);
      const totalAfter =
        (countsAfter.waiting ?? 0) +
        (countsAfter.completed ?? 0) +
        (countsAfter.active ?? 0);

      expect(totalAfter).toBeGreaterThanOrEqual(totalBefore + 1);
      expect(job).toBeDefined();
      expect(job?.id).toBe(jobId);
      expect(job?.data).toEqual({ mailboxId, messageId });
      expect(job?.name).toBe('process');
    });
  });
});

async function pollForJob(
  queue: Queue,
  jobId: string,
  mailboxId: string,
  messageId: string,
  attempts: number,
  delayMs: number,
): Promise<{ id?: string; data: unknown; name: string } | undefined> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    const job = await queue.getJob(jobId);
    if (job) return job;
    const jobs = await queue.getJobs(['waiting', 'active', 'completed']);
    const found = jobs.find((j) => {
      const d = j.data as
        | { mailboxId?: string; messageId?: string }
        | undefined;
      return d?.mailboxId === mailboxId && d?.messageId === messageId;
    });
    if (found) return found;
  }
  return undefined;
}
