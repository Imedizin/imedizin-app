/**
 * Persisted notification from GET /api/notifications
 */
export interface ApiNotification {
  id: string;
  recipientType: string;
  recipientId: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}
