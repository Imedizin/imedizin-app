import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim() || "";

/**
 * Notification event types from backend
 */
export type NotificationEventType =
  | "connected"
  | "new_email"
  | "email_updated"
  | "email_deleted"
  | "sync_started"
  | "sync_completed";

/**
 * Base notification event
 */
export interface NotificationEvent {
  type: NotificationEventType;
  timestamp: string;
  mailboxId?: string;
}

/**
 * New email notification
 */
export interface NewEmailNotification extends NotificationEvent {
  type: "new_email";
  emailId: string;
  subject: string;
  from: {
    emailAddress: string;
    displayName: string | null;
  };
  receivedAt: string | null;
}

/**
 * Sync started notification
 */
export interface SyncStartedNotification extends NotificationEvent {
  type: "sync_started";
  mailboxAddress: string;
}

/**
 * Sync completed notification
 */
export interface SyncCompletedNotification extends NotificationEvent {
  type: "sync_completed";
  mailboxAddress: string;
  messagesCreated: number;
  messagesProcessed: number;
}

/**
 * Connected notification (initial)
 */
export interface ConnectedNotification extends NotificationEvent {
  type: "connected";
  clientId: string;
}

/**
 * Union type for all notifications
 */
export type Notification =
  | ConnectedNotification
  | NewEmailNotification
  | SyncStartedNotification
  | SyncCompletedNotification;

interface UseNotificationsOptions {
  /**
   * Filter notifications to specific mailbox IDs
   * If not provided, receives all notifications
   */
  mailboxIds?: string[];
  /**
   * Show toast notifications for new emails
   * @default true
   */
  showToasts?: boolean;
  /**
   * Auto-refresh email queries on new emails
   * @default true
   */
  autoRefresh?: boolean;
  /**
   * Callback when a new email arrives
   */
  onNewEmail?: (notification: NewEmailNotification) => void;
  /**
   * Callback when sync completes
   */
  onSyncComplete?: (notification: SyncCompletedNotification) => void;
  /**
   * Enable/disable notifications
   * @default true
   */
  enabled?: boolean;
}

interface UseNotificationsReturn {
  isConnected: boolean;
  lastNotification: Notification | null;
}

/**
 * Hook to subscribe to real-time email notifications via SSE
 *
 * @example
 * ```tsx
 * const { isConnected, lastNotification } = useNotifications({
 *   showToasts: true,
 *   onNewEmail: (notification) => console.log('New email:', notification),
 * });
 * ```
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    mailboxIds,
    showToasts = true,
    autoRefresh = true,
    onNewEmail,
    onSyncComplete,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCleaningUpRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<Notification | null>(
    null
  );

  // Store callbacks in refs to avoid re-triggering effect
  const optionsRef = useRef({
    showToasts,
    autoRefresh,
    onNewEmail,
    onSyncComplete,
  });

  // Update refs when options change (without triggering reconnect)
  optionsRef.current = {
    showToasts,
    autoRefresh,
    onNewEmail,
    onSyncComplete,
  };

  // Build mailbox filter string (stable reference)
  const mailboxFilter = mailboxIds?.join(",") || "";

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Prevent multiple connections
    if (eventSourceRef.current) {
      console.log("[Notifications] Already connected, skipping");
      return;
    }

    isCleaningUpRef.current = false;

    // Build URL with optional mailbox filter
    let url = `${API_BASE_URL}/api/notifications/stream`;
    if (mailboxFilter) {
      url += `?mailboxIds=${mailboxFilter}`;
    }

    console.log("[Notifications] Connecting to SSE:", url);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[Notifications] SSE connection opened");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        console.log("[Notifications] Received:", notification.type);
        setLastNotification(notification);

        const opts = optionsRef.current;

        switch (notification.type) {
          case "connected":
            console.log(
              "[Notifications] Connected with client ID:",
              (notification as ConnectedNotification).clientId
            );
            break;

          case "new_email": {
            const newEmail = notification as NewEmailNotification;
            const fromName =
              newEmail.from.displayName ||
              newEmail.from.emailAddress.split("@")[0];
            const truncatedSubject =
              newEmail.subject.length > 40
                ? newEmail.subject.slice(0, 40) + "..."
                : newEmail.subject;

            // Add to notification panel list
            useNotificationStore.getState().addNotification({
              type: "new_email",
              title: `${fromName} sent you an email`,
              description: truncatedSubject,
              from: {
                name: fromName,
                emailAddress: newEmail.from.emailAddress,
              },
              timestamp: newEmail.timestamp,
              metadata: {
                emailId: newEmail.emailId,
                subject: newEmail.subject,
                mailboxId: newEmail.mailboxId,
              },
            });

            // Show toast
            if (opts.showToasts) {
              message.info(
                `New email from ${fromName}: ${truncatedSubject}`,
                5
              );
            }

            // Auto-refresh email and thread lists so Mails.tsx and other views update
            if (opts.autoRefresh) {
              queryClient.invalidateQueries({ queryKey: ["emails"] });
              queryClient.invalidateQueries({ queryKey: ["threads"] });
              // Invalidate thread detail so the open conversation refetches and shows the new message
              queryClient.invalidateQueries({ queryKey: ["threadDetails"] });
            }

            // Callback
            opts.onNewEmail?.(newEmail);
            break;
          }

          case "sync_completed": {
            const syncComplete = notification as SyncCompletedNotification;

            // Add to notification panel list when new messages were created
            if (syncComplete.messagesCreated > 0) {
              useNotificationStore.getState().addNotification({
                type: "sync_completed",
                title: "Sync completed",
                description: `${syncComplete.messagesCreated} new email(s) in ${syncComplete.mailboxAddress}`,
                from: { name: syncComplete.mailboxAddress },
                timestamp: syncComplete.timestamp,
                metadata: {
                  mailboxAddress: syncComplete.mailboxAddress,
                  messagesCreated: syncComplete.messagesCreated,
                  messagesProcessed: syncComplete.messagesProcessed,
                },
              });
            }

            if (opts.showToasts && syncComplete.messagesCreated > 0) {
              message.success(
                `Synced ${syncComplete.messagesCreated} new emails`
              );
            }

            // Refresh lists when sync added new messages (e.g. after webhook)
            if (opts.autoRefresh && syncComplete.messagesCreated > 0) {
              queryClient.invalidateQueries({ queryKey: ["emails"] });
              queryClient.invalidateQueries({ queryKey: ["threads"] });
              queryClient.invalidateQueries({ queryKey: ["threadDetails"] });
            }

            // Callback
            opts.onSyncComplete?.(syncComplete);
            break;
          }

          case "sync_started":
            // Could show a loading indicator
            break;

          default:
            console.log("[Notifications] Unknown event type:", notification);
        }
      } catch (error) {
        console.error("[Notifications] Failed to parse event:", error);
      }
    };

    eventSource.onerror = () => {
      console.error("[Notifications] SSE error");
      setIsConnected(false);

      // Don't reconnect if we're cleaning up
      if (isCleaningUpRef.current) {
        return;
      }

      // Clean up the failed connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isCleaningUpRef.current && !eventSourceRef.current) {
          console.log("[Notifications] Attempting reconnect...");
          setIsConnected(false);
        }
      }, 5000);
    };

    // Cleanup function
    return () => {
      console.log("[Notifications] Cleaning up SSE connection");
      isCleaningUpRef.current = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setIsConnected(false);
    };
  }, [enabled, mailboxFilter, queryClient]);

  return {
    isConnected,
    lastNotification,
  };
}
