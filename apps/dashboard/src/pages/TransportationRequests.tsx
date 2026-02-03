import React, { useState } from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Tag,
  message,
} from "antd";
import { HomeOutlined, PlusOutlined, CarOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import TransportationRequestForm from "@/components/forms/TransportationRequestForm";
import { primaryColor } from "@/theme/constants";
import {
  useListTransportationRequestsQuery,
  useAddTransportationRequestCommand,
} from "@/services/transportation-requests";
import type { TransportationRequest } from "@/types/transportation-request";

const { Title, Text } = Typography;

const TransportationRequests: React.FC = () => {
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch transportation requests
  const {
    data: requests = [],
    isLoading,
    error,
  } = useListTransportationRequestsQuery();

  // Commands
  const { addMutation } = useAddTransportationRequestCommand();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "default";
      case "pending":
        return "processing";
      case "confirmed":
        return "success";
      case "in_progress":
        return "warning";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const columns: ColumnsType<TransportationRequest> = [
    {
      title: "Request Number",
      dataIndex: "requestNumber",
      key: "requestNumber",
      render: (text: string, record: TransportationRequest) => (
        <Link
          to={`/transportation-requests/${record.id}`}
          style={{ fontWeight: 500, color: primaryColor }}
        >
          {text}
        </Link>
      ),
    },
    {
      title: "Pickup Address",
      dataIndex: "pickupAddress",
      key: "pickupAddress",
      ellipsis: true,
    },
    {
      title: "Dropoff Address",
      dataIndex: "dropoffAddress",
      key: "dropoffAddress",
      ellipsis: true,
    },
    {
      title: "Linked Threads",
      dataIndex: "threadIds",
      key: "threadIds",
      render: (threadIds: string[]) => {
        if (!threadIds || threadIds.length === 0) {
          return <span style={{ color: "#999" }}>None</span>;
        }
        return <Tag color="blue">{threadIds.length} thread(s)</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase().replace("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  const handleSubmit = (values: {
    pickupAddress: string;
    dropoffAddress: string;
    threadIds?: string[];
  }) => {
    addMutation.mutateAsync(values).then(() => {
      handleClose();
    });
  };

  const handleClose = () => {
    form.resetFields();
    setDrawerOpen(false);
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/" },
            {
              title: (
                <>
                  <CarOutlined style={{ marginRight: 4 }} />
                  Transportation Requests
                </>
              ),
            },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Transportation Requests
            </Title>
            <Text type="secondary">
              Manage ambulance and transportation requests
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setDrawerOpen(true);
            }}
            style={{ backgroundColor: primaryColor }}
          >
            New Request
          </Button>
        </div>
      </div>

      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}
      >
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#fff2f0",
              borderRadius: 4,
            }}
          >
            <Text type="danger">
              Error loading requests: {(error as Error).message}
            </Text>
          </div>
        )}
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      <Drawer
        title="New Transportation Request"
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
              loading={addMutation.isPending}
              style={{ backgroundColor: primaryColor }}
            >
              Create Request
            </Button>
          </Space>
        }
      >
        <TransportationRequestForm form={form} onSubmit={handleSubmit} />
      </Drawer>
    </>
  );
};

export default TransportationRequests;
