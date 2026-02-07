import { Controller, Get, Query, Inject } from "@nestjs/common";
import type { INotificationRepository } from "../../../notifications/domain/interfaces/notification.repository.interface";
import { NOTIFICATION_REPOSITORY } from "../../../notifications/notifications.module";

/**
 * NotificationController - persisted notifications (inbox) only.
 * Real-time is handled by Socket.IO (realtime module).
 */
@Controller("api/notifications")
export class NotificationController {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  /**
   * List persisted notifications (inbox).
   * GET /api/notifications
   * Query params: recipientType, recipientId, limit, offset
   */
  @Get()
  async list(
    @Query("recipientType") recipientType?: string,
    @Query("recipientId") recipientId?: string,
    @Query("limit") limitParam?: string,
    @Query("offset") offsetParam?: string,
  ) {
    const limit = limitParam != null ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam != null ? parseInt(offsetParam, 10) : 0;
    const notifications = await this.notificationRepository.list({
      recipientType: recipientType ?? undefined,
      recipientId: recipientId ?? undefined,
      limit: Number.isNaN(limit) ? 50 : Math.min(limit, 100),
      offset: Number.isNaN(offset) ? 0 : offset,
    });
    return {
      data: notifications.map((n) => ({
        id: n.id,
        recipientType: n.recipientType,
        recipientId: n.recipientId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }
}
