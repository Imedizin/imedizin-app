import { and, desc, eq } from "drizzle-orm";
import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE } from "../../../../shared/common/database/database.module";
import type { Database } from "../../../../shared/common/database/database.module";
import { notifications } from "../schema";
import { Notification } from "../../domain/entities/notification.entity";
import {
  CreateNotificationInput,
  INotificationRepository,
  ListNotificationsOptions,
} from "../../domain/interfaces/notification.repository.interface";

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: Database
  ) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    const [row] = await this.db
      .insert(notifications)
      .values({
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        data: input.data ?? null,
      })
      .returning();

    return this.toEntity(row);
  }

  async list(options: ListNotificationsOptions = {}): Promise<Notification[]> {
    const { recipientType, recipientId, limit = 50, offset = 0 } = options;
    let whereClause: ReturnType<typeof eq> | ReturnType<typeof and> | undefined;
    if (recipientType != null && recipientId != null) {
      whereClause = and(
        eq(notifications.recipientType, recipientType),
        eq(notifications.recipientId, recipientId)
      );
    } else if (recipientType != null) {
      whereClause = eq(notifications.recipientType, recipientType);
    } else if (recipientId != null) {
      whereClause = eq(notifications.recipientId, recipientId);
    }
    const rows = await this.db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    return rows.map((row) => this.toEntity(row));
  }

  private toEntity(row: typeof notifications.$inferSelect): Notification {
    return new Notification(
      row.id,
      row.recipientType,
      row.recipientId,
      row.type,
      row.title,
      row.body,
      row.data as Record<string, unknown> | null,
      row.readAt,
      row.createdAt
    );
  }
}
