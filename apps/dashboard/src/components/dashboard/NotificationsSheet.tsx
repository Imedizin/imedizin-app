import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, Button, Avatar, Typography, Spin, Empty } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useNotificationStore } from "@/stores/notification.store";
import { useGetNotificationsQuery } from "@/services/notifications";
import { apiClient } from "@/api/client";
import { useTheme } from "@/hooks/useTheme";
import { primaryColor } from "@/theme/constants";
import type { ApiNotification } from "@/types/notification";
import type { EmailDetail } from "@/types/email";

function formatTimeAgo(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getDateGroup(iso: string): "today" | "yesterday" | "older" {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d.getTime() === today.getTime()) return "today";
  if (d.getTime() === yesterday.getTime()) return "yesterday";
  return "older";
}

function getInitial(item: ApiNotification): string {
  const data = item.data as {
    from?: { displayName?: string; emailAddress?: string };
  } | null;
  const from = data?.from;
  if (from?.displayName) {
    const parts = from.displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0][0] ?? "?").toUpperCase();
  }
  if (from?.emailAddress) return from.emailAddress[0].toUpperCase();
  return "?";
}

function getBodySnippet(item: ApiNotification, maxLen: number = 60): string | null {
  if (!item.body || typeof item.body !== "string") return null;
  const text = item.body.replace(/\s+/g, " ").trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "…";
}

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationsSheet: React.FC<NotificationsSheetProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [loadingEmailId, setLoadingEmailId] = useState<string | null>(null);
  const { notifications: liveNotifications, clearAll } = useNotificationStore();
  const {
    data: apiNotifications = [],
    isLoading,
    isError,
    refetch,
  } = useGetNotificationsQuery({ limit: 50 }, { enabled: open });

  const hasLive = liveNotifications.length > 0;

  const grouped = useMemo(() => {
    const today: ApiNotification[] = [];
    const yesterday: ApiNotification[] = [];
    const older: ApiNotification[] = [];
    for (const n of apiNotifications) {
      const g = getDateGroup(n.createdAt);
      if (g === "today") today.push(n);
      else if (g === "yesterday") yesterday.push(n);
      else older.push(n);
    }
    return { today, yesterday, older };
  }, [apiNotifications]);

  const handleView = async (emailId: string) => {
    setLoadingEmailId(emailId);
    try {
      const email = await apiClient
        .get(`emails/${emailId}`)
        .json<EmailDetail>();
      onOpenChange(false);
      if (email.threadId) {
        navigate(`/mails/${email.threadId}`);
      } else {
        navigate("/mails", { state: { highlightEmailId: emailId } });
      }
    } catch {
      navigate("/mails", { state: { highlightEmailId: emailId } });
    } finally {
      setLoadingEmailId(null);
    }
  };

  const renderGroup = (
    label: string,
    items: ApiNotification[]
  ) => {
    if (items.length === 0) return null;
    return (
      <div key={label} style={{ marginBottom: 20 }}>
        <Typography.Text
          strong
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
            display: "block",
            marginBottom: 10,
            paddingLeft: 4,
          }}
        >
          {label}
        </Typography.Text>
        {items.map((item) => {
          const data = item.data as { emailId?: string } | null;
          const snippet = getBodySnippet(item);
          const isUnread = item.readAt == null;
          return (
            <div
              key={item.id}
              role={data?.emailId ? "button" : undefined}
              tabIndex={data?.emailId ? 0 : undefined}
              onClick={
                data?.emailId
                  ? () => handleView(data.emailId!)
                  : undefined
              }
              onKeyDown={
                data?.emailId
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleView(data!.emailId!);
                      }
                    }
                  : undefined
              }
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 0",
                marginLeft: -8,
                marginRight: -8,
                paddingLeft: 8,
                paddingRight: 8,
                borderBottom:
                  "1px solid " +
                  (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"),
                transition: "background 0.15s ease",
                cursor: data?.emailId ? "pointer" : "default",
                opacity: data?.emailId && loadingEmailId === data.emailId ? 0.7 : 1,
              }}
              className="notification-sheet-item"
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Avatar
                  size={40}
                  style={{
                    backgroundColor: primaryColor,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {getInitial(item)}
                </Avatar>
                {isUnread && (
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: primaryColor,
                      border: "2px solid " + (isDark ? "#141414" : "#fff"),
                      boxSizing: "border-box",
                    }}
                    aria-hidden
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text
                  strong
                  style={{
                    fontSize: 14,
                    color: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)",
                    display: "block",
                    lineHeight: 1.35,
                    marginBottom: snippet ? 4 : 0,
                  }}
                >
                  {item.title}
                </Typography.Text>
                {snippet && (
                  <Typography.Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      display: "block",
                      lineHeight: 1.4,
                      marginBottom: 6,
                    }}
                    ellipsis
                  >
                    {snippet}
                  </Typography.Text>
                )}
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 11 }}
                >
                  {formatTimeAgo(item.createdAt)}
                </Typography.Text>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Drawer
      title="Notifications"
      placement="right"
      width={400}
      open={open}
      onClose={() => onOpenChange(false)}
      destroyOnClose
      styles={{
        body: { paddingTop: 8 },
        header: { borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" },
      }}
      extra={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh notifications"
          />
          {hasLive && (
            <Button type="link" size="small" onClick={() => clearAll()}>
              Clear live
            </Button>
          )}
        </span>
      }
    >
      <Typography.Text
        type="secondary"
        style={{ fontSize: 13, display: "block", marginBottom: 16 }}
      >
        Recent emails and sync activity.
      </Typography.Text>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12 }}>
            <Typography.Text type="secondary">Loading…</Typography.Text>
          </div>
        </div>
      ) : isError ? (
        <div style={{ textAlign: "center", padding: 32 }}>
          <Typography.Text type="danger">Failed to load notifications.</Typography.Text>
          <br />
          <Button
            type="primary"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            style={{ marginTop: 12 }}
          >
            Retry
          </Button>
        </div>
      ) : apiNotifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Typography.Text type="secondary">
              No notifications yet. New emails and activity will appear here.
            </Typography.Text>
          }
          style={{ marginTop: 32 }}
        />
      ) : (
        <div style={{ marginTop: 4 }}>
          {renderGroup("Today", grouped.today)}
          {renderGroup("Yesterday", grouped.yesterday)}
          {renderGroup("Older", grouped.older)}
        </div>
      )}
    </Drawer>
  );
};

export default NotificationsSheet;
