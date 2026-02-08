import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Avatar, Dropdown, Badge, Button } from "antd";
import type { MenuProps } from "antd";
import {
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useTheme } from "@/hooks/useTheme";
import { primaryColor } from "@/theme/constants";
import MailboxSwitcher from "@/components/dashboard/MailboxSwitcher";
import NotificationsSheet from "@/components/dashboard/NotificationsSheet";
import { AllowNotificationsButton } from "@/components/dashboard/AllowNotificationsButton";
import { useNotificationStore } from "@/stores/notification.store";

const { Header } = Layout;

const NOTIFICATION_SOUND_URL = "/sounds/notification.mp3";

function playNotificationSound(): void {
  const audio = new Audio(NOTIFICATION_SOUND_URL);
  audio.volume = 0.7;
  audio.play();
}

const userMenuItems: MenuProps["items"] = [
  {
    key: "profile",
    label: "Profile",
    icon: <UserOutlined />,
  },
  {
    key: "settings",
    label: "Settings",
    icon: <SettingOutlined />,
  },
  {
    type: "divider",
  },
  {
    key: "logout",
    label: "Logout",
    icon: <LogoutOutlined />,
    danger: true,
  },
];

interface DashboardHeaderProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  collapsed,
  onToggleCollapsed,
}) => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationCount = useNotificationStore((s) => s.notifications.length);

  const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      sessionStorage.removeItem("fake-signed-in");
      sessionStorage.removeItem("fake-user-email");
      navigate("/sign-in", { replace: true });
    }
  };

  return (
    <Header
      style={{
        padding: "0 24px",
        background: isDark ? "#141414" : "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapsed}
          style={{
            fontSize: 16,
            width: 40,
            height: 40,
          }}
        />
        <MailboxSwitcher />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Button
          type="text"
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          style={{ fontSize: 18 }}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        />
        <AllowNotificationsButton />
        {/* Test notification button – commented out
        {typeof Notification !== "undefined" &&
          Notification.permission === "granted" &&
          "serviceWorker" in navigator && (
            <Button
              type="text"
              size="small"
              onClick={() => {
                playNotificationSound();
                navigator.serviceWorker.ready.then((reg) => {
                  const target =
                    navigator.serviceWorker.controller ?? reg.active;
                  target?.postMessage({ type: "SHOW_TEST_NOTIFICATION" });
                });
              }}
              title="Send test notification to service worker"
            >
              Test notification
            </Button>
          )}
        */}
        <Badge count={notificationCount} size="small">
          <Button
            type="text"
            icon={<BellOutlined />}
            style={{ fontSize: 18 }}
            onClick={() => setNotificationsOpen(true)}
            title="Notifications"
          />
        </Badge>
        <NotificationsSheet
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
        />
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          placement="bottomRight"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 8,
            }}
          >
            <Avatar
              size={36}
              style={{ backgroundColor: primaryColor }}
              icon={<UserOutlined />}
            />
            <div style={{ lineHeight: 1.3 }}>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  color: isDark ? "#fff" : undefined,
                }}
              >
                John Doe
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: isDark ? "#8c8c8c" : "#8c8c8c",
                }}
              >
                Admin
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default DashboardHeader;
