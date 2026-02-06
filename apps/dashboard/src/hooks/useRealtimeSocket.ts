import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { useNotificationStore } from "@/stores/notification.store";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim() || "";
const NOTIFICATION_SOUND_URL = "/sounds/notification.mp3";

/** Play notification sound. Unlock first via unlockNotificationSound() on a user gesture. */
function playNotificationSound(): void {
  const audio = new Audio(NOTIFICATION_SOUND_URL);
  audio.volume = 0.7;
  audio.play().catch(() => {
    // Autoplay blocked: call unlockNotificationSound() on first user click so sound can play later
  });
}

/** Call once after a user gesture (e.g. click) so notification sound can play later. */
function unlockNotificationSound(): void {
  const audio = new Audio(NOTIFICATION_SOUND_URL);
  audio.volume = 0;
  audio.play().then(() => audio.pause()).catch(() => {});
}

/** One-time listener: unlock audio on first user click so notification sound can play. */
export function useUnlockNotificationSound(): void {
  useEffect(() => {
    const unlock = (): void => {
      unlockNotificationSound();
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);
}

/** Realtime event from Socket.IO. */
export interface RealtimeEvent<T = Record<string, unknown>> {
  topic: string;
  payload: T;
  scope?: Record<string, string>;
  timestamp?: string;
}

/** email.received payload (from backend realtime module). */
export interface EmailReceivedPayload {
  emailId: string;
  subject: string;
  from: { emailAddress: string; displayName: string | null };
  receivedAt: string | null;
  mailboxAddress?: string;
}

export interface UseRealtimeSocketOptions {
  /** Callback when email.received is received */
  onEmailReceived?: (payload: EmailReceivedPayload, mailboxId: string | undefined) => void;
  /** Enable connection. @default true */
  enabled?: boolean;
}

export interface UseRealtimeSocketReturn {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
}

/**
 * Subscribe to the realtime Socket.IO namespace (/realtime).
 * Listens for email.received and invalidates emails query; optional callback.
 */
export function useRealtimeSocket(
  options: UseRealtimeSocketOptions = {}
): UseRealtimeSocketReturn {
  const { onEmailReceived, enabled = true } = options;

  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const onEmailReceivedRef = useRef(onEmailReceived);
  onEmailReceivedRef.current = onEmailReceived;

  useEffect(() => {
    if (!enabled) return;

    const baseUrl = API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const socket = io(`${baseUrl}/realtime`, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("email.received", (event: RealtimeEvent) => {
      setLastEvent(event);
      const payload = event.payload as unknown as EmailReceivedPayload;
      const mailboxIdFromScope = event.scope?.mailboxId;
      // Invalidate so threads list and email list refetch (same as sync-mailbox)
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["threadDetails"] });

      // In-app: notification panel + browser Notification API (via service worker) + sound
      const fromName =
        payload.from?.displayName ||
        payload.from?.emailAddress?.split("@")[0] ||
        "Someone";
      const subject = payload.subject ?? "(No subject)";
      const truncatedSubject =
        subject.length > 40 ? `${subject.slice(0, 40)}...` : subject;
      const notificationTitle = `${fromName} sent you an email`;
      const notificationBody = truncatedSubject;

      useNotificationStore.getState().addNotification({
        type: "new_email",
        title: notificationTitle,
        description: truncatedSubject,
        from: {
          name: fromName,
          emailAddress: payload.from?.emailAddress,
        },
        timestamp: payload.receivedAt ?? new Date().toISOString(),
        metadata: {
          emailId: payload.emailId,
          subject: payload.subject,
          mailboxId: mailboxIdFromScope,
        },
      });

      playNotificationSound();

      // Browser Notification API (same as test notification button) via service worker
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted" &&
        "serviceWorker" in navigator
      ) {
        navigator.serviceWorker.ready.then((reg) => {
          const target = navigator.serviceWorker.controller ?? reg.active;
          target?.postMessage({
            type: "SHOW_EMAIL_NOTIFICATION",
            title: notificationTitle,
            body: notificationBody,
            icon: "/favicon.ico",
            tag: `email-${payload.emailId}`,
            data: {
              emailId: payload.emailId,
              mailboxId: mailboxIdFromScope,
            },
          });
        });
      }

      onEmailReceivedRef.current?.(payload, mailboxIdFromScope);
    });

    return () => {
      socket.disconnect();
      socket.removeAllListeners();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, queryClient]);

  return { isConnected, lastEvent };
}
