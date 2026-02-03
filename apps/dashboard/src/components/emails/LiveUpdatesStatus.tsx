import React, { useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { useMailboxStore } from "@/stores/mailbox.store";

export interface LiveUpdatesStatusProps {
  /** "inline" for header/toolbar; "default" for sidebar */
  variant?: "default" | "inline";
}

const LiveUpdatesStatus: React.FC<LiveUpdatesStatusProps> = ({
  variant = "default",
}) => {
  const { isDark } = useTheme();
  const { selectedMailboxId, lastUpdateAt } = useMailboxStore();
  const notificationMailboxIds = useMemo(
    () => (selectedMailboxId ? [selectedMailboxId] : undefined),
    [selectedMailboxId],
  );
  const { isConnected } = useNotifications({
    mailboxIds: notificationMailboxIds,
    showToasts: true,
    autoRefresh: true,
  });
  const formatLastUpdated = () => {
    if (lastUpdateAt == null) return "";
    const date = new Date(lastUpdateAt);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isInline = variant === "inline";
  const mutedColor = isDark ? "#8c8c8c" : "#595959";
  const dotColor = isConnected ? "#52c41a" : "#ff4d4f";

  const dot = (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        backgroundColor: dotColor,
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  );

  const statusLabel = isConnected ? "Live" : "Reconnecting";
  const updatedLabel =
    lastUpdateAt != null ? `Updated ${formatLastUpdated()}` : null;

  const pillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: isInline ? 12 : 11,
    lineHeight: 1.2,
    color: mutedColor,
    padding: "4px 10px",
    borderRadius: 6,
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    height: "fit-content",
    alignSelf: "center",
  };

  return (
    <div style={pillStyle}>
      {dot}
      <span>{statusLabel}</span>
      {updatedLabel != null && (
        <>
          <span style={{ opacity: 0.6 }}>·</span>
          <span style={{ fontSize: isInline ? 11 : 10 }}>{updatedLabel}</span>
        </>
      )}
    </div>
  );
};

export default LiveUpdatesStatus;
