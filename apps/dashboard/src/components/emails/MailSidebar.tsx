import React from "react";
import { Divider, Tag } from "antd";
import { useTheme } from "@/hooks/useTheme";
import MailSidebarActions from "@/components/emails/MailSidebarActions";
import LiveUpdatesStatus from "@/components/emails/LiveUpdatesStatus";

export interface MailSidebarFolder {
  key: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

export interface MailSidebarProps {
  /** Optional folder list (All Mail, Inbox, Sent). Omit for sidebar without folders. */
  folders?: MailSidebarFolder[];
  /** Currently selected folder key (for highlight). */
  activeFolderKey?: string;
  /** Called when a folder is clicked. */
  onFolderSelect?: (key: string) => void;
  /** Width of the sidebar. Default 220. */
  width?: number;
}

const primaryColor = "#0d7377";

const MailSidebar: React.FC<MailSidebarProps> = ({
  folders = [],
  activeFolderKey,
  onFolderSelect,
  width = 220,
}) => {
  const { isDark } = useTheme();

  return (
    <div
      style={{
        width,
        borderRight: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
        padding: 16,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MailSidebarActions />

      <Divider style={{ margin: "8px 0" }} />

      {folders.length > 0 && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {folders.map((folder) => {
            const isActive = activeFolderKey === folder.key;
            return (
              <div
                key={folder.key}
                role="button"
                tabIndex={0}
                onClick={() => onFolderSelect?.(folder.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onFolderSelect?.(folder.key);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 8,
                  cursor: onFolderSelect ? "pointer" : "default",
                  backgroundColor: isActive
                    ? isDark
                      ? "rgba(13, 115, 119, 0.15)"
                      : "rgba(13, 115, 119, 0.08)"
                    : "transparent",
                  color: isDark ? "#fff" : "#333",
                  transition: "all 0.2s",
                  marginBottom: 4,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: isDark ? "#8c8c8c" : "#666" }}>
                    {folder.icon}
                  </span>
                  <span style={{ fontSize: 14 }}>{folder.label}</span>
                </div>
                {folder.count !== undefined && folder.count > 0 && (
                  <Tag
                    color={primaryColor}
                    style={{ marginRight: 0, borderRadius: 10 }}
                  >
                    {folder.count}
                  </Tag>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "auto" }}>
        <LiveUpdatesStatus />
      </div>
    </div>
  );
};

export default MailSidebar;
