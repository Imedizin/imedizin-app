import { Module, Global } from "@nestjs/common";
import { NotificationRepository } from "./infrastructure/repositories/notification.repository";

export const NOTIFICATION_REPOSITORY = "INotificationRepository";

/**
 * Simple notifications module – persisted inbox (create notification).
 * Other modules import this and use INotificationRepository to create notifications.
 */
@Global()
@Module({
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationRepository,
    },
  ],
  exports: [NOTIFICATION_REPOSITORY],
})
export class NotificationsModule {}
