import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, List, Button, Avatar, Typography, Spin } from "antd";
import { useNotificationStore } from "@/stores/notification.store";
import { useGetNotificationsQuery } from "@/services/notifications";
import { apiClient } from "@/api/client";
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

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationsSheet: React.FC<NotificationsSheetProps> = ({
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [loadingEmailId, setLoadingEmailId] = useState<string | null>(null);
  const { notifications: liveNotifications, clearAll } = useNotificationStore();
  const {
    data: apiNotifications = [],
    isLoading,
    isError,
    refetch,
  } = useGetNotificationsQuery({ limit: 50 }, { enabled: open });

  const hasLive = liveNotifications.length > 0;

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

  return (
    <Drawer
      title="Notifications"
      placement="right"
      width={380}
      open={open}
      onClose={() => onOpenChange(false)}
      destroyOnClose
      extra={
        hasLive ? (
          <Button type="link" size="small" onClick={() => clearAll()}>
            Clear live
          </Button>
        ) : undefined
      }
    >
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Recent emails and sync activity.
      </Typography.Text>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : isError ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Typography.Text type="danger">Failed to load.</Typography.Text>
          <br />
          <Button
            size="small"
            onClick={() => refetch()}
            style={{ marginTop: 8 }}
          >
            Retry
          </Button>
        </div>
      ) : apiNotifications.length === 0 ? (
        <Typography.Text
          type="secondary"
          style={{ display: "block", padding: 40, textAlign: "center" }}
        >
          No notifications yet.
        </Typography.Text>
      ) : (
        <List
          dataSource={apiNotifications}
          rowKey="id"
          style={{ marginTop: 16 }}
          split
          renderItem={(item) => {
            const data = item.data as { emailId?: string } | null;
            return (
              <List.Item
                extra={
                  data?.emailId ? (
                    <Button
                      type="link"
                      size="small"
                      loading={loadingEmailId === data.emailId}
                      onClick={() => handleView(data.emailId!)}
                    >
                      View
                    </Button>
                  ) : null
                }
              >
                <List.Item.Meta
                  avatar={<Avatar size="small">{getInitial(item)}</Avatar>}
                  title={item.title}
                  description={formatTimeAgo(item.createdAt)}
                />
              </List.Item>
            );
          }}
        />
      )}
    </Drawer>
  );
};

export default NotificationsSheet;
