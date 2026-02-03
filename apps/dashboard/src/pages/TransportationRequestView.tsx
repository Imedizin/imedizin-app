import React, { useState, useEffect } from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Descriptions,
  Tag,
  Button,
  Spin,
  Space,
  Drawer,
  Form,
  List,
  Skeleton,
  Tooltip,
  message,
  theme,
} from "antd";
import {
  HomeOutlined,
  CarOutlined,
  ArrowLeftOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  EditOutlined,
  MailOutlined,
  RightOutlined,
  CopyOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  useGetTransportationRequestQuery,
  useUpdateTransportationRequestCommand,
} from "@/services/transportation-requests";
import { apiClient } from "@/api/client";
import TransportationRequestForm from "@/components/forms/TransportationRequestForm";
import { primaryColor } from "@/theme/constants";
import type { TransportationRequest } from "@/types/transportation-request";
import type { TransportationRequestFormData } from "@/types/transportation-request";
import type { ThreadDetail } from "@/types/email";

const { Title, Text } = Typography;

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "default";
    case "pending":
      return "processing";
    case "confirmed":
    case "completed":
      return "success";
    case "in_progress":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

/** Fetches and displays linked email threads with subject, message count, and link */
const LinkedThreadsCard: React.FC<{ threadIds: string[] }> = ({
  threadIds,
}) => {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const threadQueries = useQueries({
    queries: threadIds.map((threadId) => ({
      queryKey: ["threadDetails", threadId] as const,
      queryFn: () =>
        apiClient.get(`emails/thread/${threadId}`).json<ThreadDetail>(),
      enabled: !!threadId,
    })),
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year:
        d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyThreadId = (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(threadId);
    message.success("Thread ID copied");
  };

  if (threadIds.length === 0) {
    return (
      <Card
        title={
          <Space>
            <LinkOutlined />
            Linked threads
          </Space>
        }
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}
      >
        <Typography.Text type="secondary">No linked threads</Typography.Text>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <LinkOutlined />
          Linked threads
          <Tag color="blue">{threadIds.length} thread(s)</Tag>
        </Space>
      }
      bordered={false}
      style={{
        borderRadius: 12,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      }}
    >
      <List
        size="small"
        dataSource={threadIds.map((id, i) => ({
          threadId: id,
          query: threadQueries[i],
        }))}
        renderItem={({ threadId, query }) => {
          const { data, isLoading, isError, error } = query;
          if (isLoading) {
            return (
              <List.Item>
                <Skeleton.Input active size="small" style={{ width: 280 }} />
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 80, marginLeft: 8 }}
                />
              </List.Item>
            );
          }
          if (isError || !data) {
            return (
              <List.Item>
                <Space>
                  <Typography.Text type="secondary">Thread</Typography.Text>
                  <Tag color="red">Failed to load</Tag>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {threadId}
                  </Typography.Text>
                </Space>
              </List.Item>
            );
          }
          const thread = data as ThreadDetail;
          const latestDate =
            thread.messages?.length > 0
              ? thread.messages[thread.messages.length - 1]?.receivedAt ||
                thread.messages[thread.messages.length - 1]?.sentAt
              : null;
          const openThreadInNewTab = () => {
            window.open(`/mails/${threadId}`, "_blank", "noopener,noreferrer");
          };

          return (
            <List.Item
              style={{
                alignItems: "center",
              }}
              actions={[
                <Tooltip key="copy" title="Copy thread ID">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={(e) => copyThreadId(e, threadId)}
                  />
                </Tooltip>,
                <Button
                  key="open"
                  type="primary"
                  size="small"
                  icon={<ExportOutlined />}
                  onClick={() => {
                    const url = `/mails/${threadId}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                  }}
                >
                  Open Thread
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: token.colorFillTertiary,
                      color: token.colorTextSecondary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MailOutlined style={{ fontSize: 18 }} />
                  </div>
                }
                title={
                  <Typography.Text strong ellipsis style={{ maxWidth: 360 }}>
                    {thread.subject || "(No subject)"}
                  </Typography.Text>
                }
                description={
                  <Space size="small" wrap>
                    <Tag>
                      {thread.messageCount} message
                      {thread.messageCount !== 1 ? "s" : ""}
                    </Tag>
                    {latestDate && (
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        {formatDate(latestDate)}
                      </Typography.Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

const TransportationRequestView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    data: request,
    isLoading,
    error,
  } = useGetTransportationRequestQuery(id ?? "");
  const { updateMutation } = useUpdateTransportationRequestCommand();

  // Initialize form when request data is loaded and drawer opens (must be before any return)
  useEffect(() => {
    if (drawerOpen && request) {
      const r = request as TransportationRequest;
      const threadIdsArray = Array.isArray(r.threadIds) ? r.threadIds : [];
      form.setFieldsValue({
        pickupAddress: r.pickupAddress,
        dropoffAddress: r.dropoffAddress,
        threadIds: threadIdsArray,
      });
    }
  }, [drawerOpen, request, form]);

  if (!id) {
    return (
      <Card>
        <Text type="danger">Invalid request: no ID provided.</Text>
        <div style={{ marginTop: 16 }}>
          <Button
            type="link"
            onClick={() => navigate("/transportation-requests")}
          >
            Back to list
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading transportation request…</Text>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <Card>
        <Text type="danger">
          {error
            ? `Error: ${(error as Error).message}`
            : "Transportation request not found."}
        </Text>
        <div style={{ marginTop: 16 }}>
          <Button
            type="link"
            onClick={() => navigate("/transportation-requests")}
          >
            Back to list
          </Button>
        </div>
      </Card>
    );
  }

  const r = request as TransportationRequest;

  // Ensure threadIds is always an array (fallback for API inconsistencies)
  const threadIds = Array.isArray(r.threadIds) ? r.threadIds : [];

  const handleEdit = () => {
    setDrawerOpen(true);
  };

  const handleClose = () => {
    form.resetFields();
    setDrawerOpen(false);
  };

  const handleSubmit = (values: TransportationRequestFormData) => {
    if (!id) return;

    updateMutation
      .mutateAsync({
        id,
        pickupAddress: values.pickupAddress,
        dropoffAddress: values.dropoffAddress,
        threadIds: values.threadIds,
      })
      .then(() => {
        handleClose();
      });
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/" },
            {
              title: (
                <Link to="/transportation-requests">
                  <CarOutlined style={{ marginRight: 4 }} />
                  Transportation Requests
                </Link>
              ),
            },
            { title: r.requestNumber },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/transportation-requests")}
              style={{ marginBottom: 8, paddingLeft: 0 }}
            >
              Back to list
            </Button>
            <Title level={3} style={{ margin: "0 0 4px 0" }}>
              {r.requestNumber}
            </Title>
            <Space align="center">
              <Tag color={getStatusColor(r.status)}>
                {r.status.toUpperCase().replace("_", " ")}
              </Tag>
            </Space>
          </div>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
            style={{ backgroundColor: primaryColor }}
          >
            Edit
          </Button>
        </div>
      </div>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card
          title="Overview"
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
        >
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered size="middle">
            <Descriptions.Item label="Request number">
              <Text strong>{r.requestNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(r.status)}>
                {r.status.toUpperCase().replace("_", " ")}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {new Date(r.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Last updated">
              {new Date(r.updatedAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title={
            <Space>
              <EnvironmentOutlined />
              Addresses
            </Space>
          }
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
        >
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="Pickup address">
              {r.pickupAddress}
            </Descriptions.Item>
            <Descriptions.Item label="Dropoff address">
              {r.dropoffAddress}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <LinkedThreadsCard threadIds={threadIds} />
      </Space>

      <Drawer
        title="Edit Transportation Request"
        width={720}
        onClose={handleClose}
        open={drawerOpen}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={updateMutation.isPending}
              style={{ backgroundColor: primaryColor }}
            >
              Save Changes
            </Button>
          </Space>
        }
      >
        <TransportationRequestForm form={form} onSubmit={handleSubmit} />
      </Drawer>
    </>
  );
};

export default TransportationRequestView;
