import { useEffect } from "react";
import { useRealtimeStream } from "@/hooks/useRealtimeStream";
import { useMailboxStore } from "@/stores/mailbox.store";
import { useRealtimeStore } from "@/stores/realtime.store";

/**
 * Runs the realtime SSE connection at layout level (one connection for the app).
 * Syncs isConnected to useRealtimeStore so LiveUpdatesStatus and others can read it.
 * Renders nothing.
 */
export function RealtimeProvider() {
  const selectedMailboxId = useMailboxStore((s) => s.selectedMailboxId);
  const setConnected = useRealtimeStore((s) => s.setConnected);
  const { isConnected } = useRealtimeStream({
    mailboxId: selectedMailboxId ?? undefined,
    enabled: true,
  });

  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected, setConnected]);

  return null;
}
