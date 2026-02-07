import React, { useState } from "react";
import { Card, Button, Space, Modal, Input, Typography } from "antd";
import { Link } from "react-router-dom";
import { MailOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  useLinkThreadCommand,
  useUnlinkThreadCommand,
} from "@/services/assistance-requests";
import { useTheme } from "@/hooks/useTheme";
import type { LinkedThreadItem } from "@/types/assistance-request";

const { Text } = Typography;

interface LinkedThreadsCardProps {
  requestId: string;
  linkedThreads: LinkedThreadItem[];
}

function threadDisplayLabel(item: LinkedThreadItem): string {
  if (item.subject?.trim()) return item.subject;
  return "Unknown thread";
}

export const LinkedThreadsCard: React.FC<LinkedThreadsCardProps> = ({
  requestId,
  linkedThreads,
}) => {
  const { isDark } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [threadIdInput, setThreadIdInput] = useState("");
  const linkMutation = useLinkThreadCommand(requestId);
  const unlinkMutation = useUnlinkThreadCommand(requestId);

  const threadRowBg = isDark ? "rgba(255, 255, 255, 0.06)" : "#fafafa";

  const handleLink = () => {
    const tid = threadIdInput.trim();
    if (!tid) return;
    linkMutation.mutate(tid, {
      onSuccess: () => {
        setThreadIdInput("");
        setModalOpen(false);
      },
    });
  };

  return (
    <>
      <Card
        title="Linked mail threads"
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}
      >
        {!linkedThreads?.length ? (
          <Text type="secondary">No linked threads.</Text>
        ) : (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            {linkedThreads.map((item) => (
              <div
                key={item.threadId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: threadRowBg,
                  borderRadius: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ display: "block" }} ellipsis>
                    {threadDisplayLabel(item)}
                  </Text>
                  {item.latestDate && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(item.latestDate).toLocaleString()}
                    </Text>
                  )}
                </div>
                <Space>
                  <Link to={`/mails/${encodeURIComponent(item.threadId)}`} target="_blank" rel="noopener noreferrer">
                    <Button type="link" size="small" icon={<MailOutlined />}>
                      Open in Mails
                    </Button>
                  </Link>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    loading={unlinkMutation.isPending}
                    onClick={() => unlinkMutation.mutate(item.threadId)}
                  >
                    Unlink
                  </Button>
                </Space>
              </div>
            ))}
          </Space>
        )}
        <div style={{ marginTop: 12 }}>
          <Button
            type="default"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            {linkedThreads?.length ? "Link another thread" : "Link a thread"}
          </Button>
        </div>
      </Card>

      <Modal
        title="Link a thread"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setThreadIdInput("");
        }}
        onOk={handleLink}
        okText="Link"
        confirmLoading={linkMutation.isPending}
        destroyOnClose
      >
        <p style={{ marginBottom: 8 }}>
          <Text type="secondary">
            Paste the thread ID (e.g. from the Mails page URL or copy from a thread).
          </Text>
        </p>
        <Input
          placeholder="Thread ID"
          value={threadIdInput}
          onChange={(e) => setThreadIdInput(e.target.value)}
          onPressEnter={handleLink}
        />
      </Modal>
    </>
  );
};
