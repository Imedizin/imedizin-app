import { Notification } from "../entities/notification.entity";

export interface CreateNotificationInput {
  recipientType: string;
  recipientId: string;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
}

export interface ListNotificationsOptions {
  recipientType?: string;
  recipientId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Notification repository – persisted inbox (create, list, mark read).
 */
export interface INotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
  list(options?: ListNotificationsOptions): Promise<Notification[]>;
}
