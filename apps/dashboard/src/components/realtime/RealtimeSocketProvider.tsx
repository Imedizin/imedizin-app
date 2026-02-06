import { useEffect } from "react";
import { useRealtimeSocket, useUnlockNotificationSound } from "@/hooks/useRealtimeSocket";
import { useRealtimeStore } from "@/stores/realtime.store";

/**
 * Socket.IO realtime connection.
 * Syncs isConnected to useRealtimeStore; on email.received invalidates emails, threads, and threadDetails so the mail list refetches.
 * Unlocks notification sound on first user click so the sound can play when emails arrive.
 */
export function RealtimeSocketProvider() {
  useUnlockNotificationSound();
  const setConnected = useRealtimeStore((s) => s.setConnected);
  const { isConnected } = useRealtimeSocket({ enabled: true });

  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected, setConnected]);

  return null;
}
