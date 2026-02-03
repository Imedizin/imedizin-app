import React, { useEffect } from "react";
import { Dropdown, Button } from "antd";
import type { MenuProps } from "antd";
import {
  MailOutlined,
  UpOutlined,
  DownOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useTheme } from "@/hooks/useTheme";
import { primaryColor, accentColor } from "@/theme/constants";
import { useMailboxStore } from "@/stores/mailbox.store";
import { useGetMailboxesQuery } from "@/services/mailboxes";
import type { Mailbox } from "@/types/mailbox";

const MailboxSwitcher: React.FC = () => {
  const { isDark } = useTheme();
  const { selectedMailboxId, setSelectedMailboxId } = useMailboxStore();
  const { data: mailboxes = [] } = useGetMailboxesQuery();

  // Set default mailbox when mailboxes load and none is selected; clear stale id when it no longer exists
  useEffect(() => {
    if (mailboxes.length === 0) return;
    const ids = new Set(mailboxes.map((m) => m.id));
    if (selectedMailboxId === null || selectedMailboxId === undefined) {
      setSelectedMailboxId(mailboxes[0].id);
    } else if (!ids.has(selectedMailboxId)) {
      setSelectedMailboxId(mailboxes[0].id);
    }
  }, [mailboxes, selectedMailboxId, setSelectedMailboxId]);

  const selectedMailbox = mailboxes.find((m) => m.id === selectedMailboxId);
  const displayName = selectedMailbox
    ? selectedMailbox.name || selectedMailbox.address
    : "Mailbox";
  const hasSubline =
    selectedMailbox?.name && selectedMailbox.address
      ? selectedMailbox.address
      : null;

  const menuItems: MenuProps["items"] = mailboxes.map((m: Mailbox) => {
    const displayName = m.name || m.address;
    const hasSubline = m.name ? m.address : false;
    const isSelected = selectedMailboxId === m.id;

    return {
      key: m.id,
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "4px 0",
            minWidth: 220,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
              flex: 1,
            }}
          >
            <span
              style={{
                fontWeight: 500,
                fontSize: 13,
                color: "inherit",
              }}
            >
              {displayName}
            </span>
            {hasSubline && (
              <span
                style={{
                  fontSize: 12,
                  color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
                }}
              >
                {m.address}
              </span>
            )}
          </div>
          {isSelected && (
            <CheckOutlined style={{ flexShrink: 0, color: primaryColor }} />
          )}
        </div>
      ),
      icon: null,
      onClick: () => setSelectedMailboxId(m.id),
    };
  });

  return (
    <Dropdown
      menu={{
        items: menuItems,
        style: { minWidth: 280 },
      }}
      trigger={["click"]}
      placement="bottomLeft"
    >
      <Button
        type="text"
        icon={<MailOutlined style={{ color: primaryColor }} />}
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 44,
          width: 240,
          minWidth: 240,
          padding: "0 12px",
          borderRadius: 8,
          color: isDark ? "rgba(255,255,255,0.85)" : primaryColor,
          border: `1px solid ${primaryColor}40`,
          lineHeight: 1,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            alignItems: "flex-start",
            justifyContent: "center",
            overflow: "hidden",
            textAlign: "left",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%",
            }}
          >
            {displayName}
          </span>
          {hasSubline ? (
            <span
              style={{
                fontSize: 11,
                lineHeight: 1.2,
                color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
              }}
            >
              {hasSubline}
            </span>
          ) : null}
        </div>
        <span
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 0.8,
            color: accentColor,
            flexShrink: 0,
          }}
        >
          <UpOutlined style={{ fontSize: 9 }} />
          <DownOutlined style={{ fontSize: 9 }} />
        </span>
      </Button>
    </Dropdown>
  );
};

export default MailboxSwitcher;
