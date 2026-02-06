import React, { useState, useCallback, useEffect } from "react";
import { Button, Tooltip, Typography } from "antd";
import { NotificationOutlined } from "@ant-design/icons";

const permission = (): NotificationPermission =>
  typeof Notification !== "undefined" ? Notification.permission : "denied";

export const AllowNotificationsButton: React.FC = () => {
  const [status, setStatus] = useState<NotificationPermission>(permission);

  const request = useCallback(async () => {
    if (status !== "default" || !("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setStatus(p);
    if (p === "granted" && "serviceWorker" in navigator) {
      await navigator.serviceWorker.ready;
      navigator.serviceWorker.controller?.postMessage({
        type: "START_REMINDERS",
      });
    }
  }, [status]);

  useEffect(() => {
    setStatus(permission());
  }, []);

  if (status === "granted" || status === "denied") return null;

  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {status}
      </Typography.Text>
      <Tooltip title="Allow reminder notifications">
        <Button
          type="text"
          icon={<NotificationOutlined />}
          style={{ fontSize: 18 }}
          onClick={request}
          aria-label="Allow notifications"
        />
      </Tooltip>
    </div>
  );
};
