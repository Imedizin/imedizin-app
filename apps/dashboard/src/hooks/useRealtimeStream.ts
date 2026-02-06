import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim() || "";

/** Realtime stream: first message from server */
export interface RealtimeConnectedMessage {
  type: "connected";
  clientId: string;
  timestamp: string;
}

/** Realtime event from GET /api/realtime/stream */
export interface RealtimeEvent<T = Record<string, unknown>> {
  topic: string;
  payload: T;
  scope?: Record<string, string>;
  timestamp?: string;
}

/** email.received payload (from backend realtime module) */
export interface EmailReceivedPayload {
  emailId: string;
  subject: string;
  from: { emailAddress: string; displayName: string | null };
  receivedAt: string | null;
  mailboxAddress?: string;
}

export interface UseRealtimeStreamOptions {
  /** Single mailbox ID to filter by (scope). Omit to receive all. */
  mailboxId?: string;
  /** Topics to subscribe to (default: email.received) */
  topics?: string[];
  /** Callback when email.received is received */
  onEmailReceived?: (
    payload: EmailReceivedPayload,
    mailboxId: string | undefined
  ) => void;
  /** Enable connection. @default true */
  enabled?: boolean;
}

export interface UseRealtimeStreamReturn {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
}

/**
 * Subscribe to the realtime SSE stream (GET /api/realtime/stream).
 * On email.received, invalidates the emails query only.
 */
export function useRealtimeStream(
  options: UseRealtimeStreamOptions = {}
): UseRealtimeStreamReturn {
  const {
    mailboxId,
    topics = ["email.received"],
    onEmailReceived,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isCleaningUpRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const onEmailReceivedRef = useRef(onEmailReceived);
  onEmailReceivedRef.current = onEmailReceived;

  useEffect(() => {
    if (!enabled) return;
    if (eventSourceRef.current) return;

    isCleaningUpRef.current = false;

    const params = new URLSearchParams();
    params.set("topics", topics.join(","));
    if (mailboxId) params.set("mailboxId", mailboxId);
    const url = `${API_BASE_URL}/api/realtime/stream?${params.toString()}`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => setIsConnected(true);

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as
          | RealtimeConnectedMessage
          | RealtimeEvent;

        if ("type" in data && data.type === "connected") {
          return;
        }

        const realtimeEvent = data as RealtimeEvent;
        setLastEvent(realtimeEvent);

        if (realtimeEvent.topic === "email.received") {
          const payload = realtimeEvent.payload as EmailReceivedPayload;
          const mailboxIdFromScope = realtimeEvent.scope?.mailboxId;

          queryClient.invalidateQueries({ queryKey: ["emails"] });

          onEmailReceivedRef.current?.(payload, mailboxIdFromScope);
        }
      } catch (err) {
        console.error("[RealtimeStream] Parse error:", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      if (isCleaningUpRef.current) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isCleaningUpRef.current && !eventSourceRef.current) {
          setIsConnected(false);
        }
      }, 5000);
    };

    return () => {
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
  }, [enabled, mailboxId, topics.join(","), queryClient]);

  return { isConnected, lastEvent };
}
