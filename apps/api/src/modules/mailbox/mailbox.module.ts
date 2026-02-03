import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { MailboxSubscriptionRepository } from './infrastructure/repositories/mailbox-subscription.repository';
import {
  NEW_MESSAGE_QUEUE,
  NewMessageProcessor,
} from './application/processors/new-message.processor';
import { ProcessNewMessageCommand } from './application/commands/process-new-message.command';
import { MailboxRepository } from './infrastructure/repositories/mailbox.repository';
import { EmailRepository } from './infrastructure/repositories/email.repository';
import { EmailAttachmentRepository } from './infrastructure/repositories/email-attachment.repository';
import { MailboxCron } from './mailbox.cron';
import { RenewSubscriptionsCommand } from './application/commands/renew-subscriptions.command';
import { AddMailboxCommand } from './application/commands/add-mailbox.command';
import { UpdateMailboxCommand } from './application/commands/update-mailbox.command';
import { DeleteMailboxCommand } from './application/commands/delete-mailbox.command';
import { ProcessNotificationCommand } from './application/commands/process-notification.command';
import { SyncMailboxCommand } from './application/commands/sync-mailbox.command';
import { SendEmailCommand } from './application/commands/send-email.command';
import { FindExpiringSubscriptionsQuery } from './application/queries/find-expiring-subscriptions.query';
import { FindAllMailboxesQuery } from './application/queries/find-all-mailboxes.query';
import { FindMailboxByIdQuery } from './application/queries/find-mailbox-by-id.query';
import { WebhookController } from './api/controllers/webhook.controller';
import { MailboxController } from './api/controllers/mailbox.controller';
import { SubscriptionController } from './api/controllers/subscription.controller';
import { DomainController } from './api/controllers/domain.controller';
import { EmailController } from './api/controllers/email.controller';
import { NotificationController } from './api/controllers/notification.controller';
import { GraphService } from './application/services/graph.service';
import { NotificationService } from './application/services/notification.service';
import { ThreadingService } from './application/services/threading.service';
import { DomainRepository } from './infrastructure/repositories/domain.repository';
import { CreateDomainCommand } from './application/commands/create-domain.command';
import { UpdateDomainCommand } from './application/commands/update-domain.command';
import { DeleteDomainCommand } from './application/commands/delete-domain.command';
import { FindAllDomainsQuery } from './application/queries/find-all-domains.query';
import { FindDomainByIdQuery } from './application/queries/find-domain-by-id.query';
import { EmailReceivedNotificationHandler } from './application/handlers/email-received-notification.handler';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NEW_MESSAGE_QUEUE,
    }),
    BullBoardModule.forFeature({
      name: NEW_MESSAGE_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [
    WebhookController,
    MailboxController,
    SubscriptionController,
    DomainController,
    EmailController,
    NotificationController,
  ],
  providers: [
    RenewSubscriptionsCommand,
    AddMailboxCommand,
    UpdateMailboxCommand,
    DeleteMailboxCommand,
    ProcessNotificationCommand,
    SyncMailboxCommand,
    SendEmailCommand,
    FindExpiringSubscriptionsQuery,
    FindAllMailboxesQuery,
    FindMailboxByIdQuery,
    CreateDomainCommand,
    UpdateDomainCommand,
    DeleteDomainCommand,
    FindAllDomainsQuery,
    FindDomainByIdQuery,
    GraphService,
    NotificationService,
    ThreadingService,
    MailboxCron,
    ProcessNewMessageCommand,
    NewMessageProcessor,
    EmailReceivedNotificationHandler,
    {
      provide: 'IMailboxSubscriptionRepository',
      useClass: MailboxSubscriptionRepository,
    },
    {
      provide: 'IMailboxRepository',
      useClass: MailboxRepository,
    },
    {
      provide: 'IDomainRepository',
      useClass: DomainRepository,
    },
    {
      provide: 'IEmailRepository',
      useClass: EmailRepository,
    },
    {
      provide: 'IEmailAttachmentRepository',
      useClass: EmailAttachmentRepository,
    },
  ],
  exports: [
    'IMailboxSubscriptionRepository',
    'IMailboxRepository',
    'IDomainRepository',
    'IEmailRepository',
    GraphService,
    NotificationService,
  ],
})
export class MailboxModule {}
