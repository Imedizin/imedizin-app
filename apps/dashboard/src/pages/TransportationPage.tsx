import React, { useMemo } from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Table,
  Button,
  Tag,
  Empty,
} from "antd";
import {
  HomeOutlined,
  SolutionOutlined,
  CarOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { primaryColor } from "@/theme/constants";
import { useAssistanceRequestsQuery } from "@/services/assistance-requests";
import type { TransportAssistanceRequest } from "@/types/assistance-request";

const { Title, Text } = Typography;

const getTransportStatusColor = (status: string) => {
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

const transportColumns: ColumnsType<TransportAssistanceRequest> = [
  {
    title: "Request number",
    dataIndex: "requestNumber",
    key: "requestNumber",
    render: (text: string, record: TransportAssistanceRequest) => (
      <Link
        to={`/assistance-requests/transportation/${record.id}`}
        state={{ request: record }}
        style={{ fontWeight: 500, color: primaryColor }}
      >
        {text}
      </Link>
    ),
  },
  {
    title: "Received",
    dataIndex: "receivedAt",
    key: "receivedAt",
    width: 160,
    render: (date: string) => (date ? new Date(date).toLocaleString() : "—"),
  },
  {
    title: "Pickup",
    dataIndex: "pickupPoint",
    key: "pickupPoint",
    ellipsis: true,
  },
  {
    title: "Dropoff",
    dataIndex: "dropOffPoint",
    key: "dropOffPoint",
    ellipsis: true,
  },
  {
    title: "Patient",
    key: "patient",
    render: (_: unknown, record: TransportAssistanceRequest) =>
      record.patient?.patientName || "—",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: string) => (
      <Tag color={getTransportStatusColor(status)}>
        {status.toUpperCase().replace("_", " ")}
      </Tag>
    ),
  },
  {
    title: "Created",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 160,
    render: (date: string) => new Date(date).toLocaleString(),
  },
];

const TransportationPage: React.FC = () => {
  const { data: requests = [], isLoading, error } = useAssistanceRequestsQuery();

  const transportRequests = useMemo(
    () =>
      requests.filter(
        (r): r is TransportAssistanceRequest => r.type === "transport"
      ),
    [requests]
  );

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/" },
            {
              title: (
                <Link to="/assistance-requests" style={{ display: "inline-flex", alignItems: "center" }}>
                  <SolutionOutlined style={{ marginRight: 4 }} />
                  Assistance Requests
                </Link>
              ),
            },
            {
              title: (
                <>
                  <CarOutlined style={{ marginRight: 4 }} />
                  Transportation
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
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Transportation
            </Title>
            <Text type="secondary">
              Transportation assistance requests
            </Text>
          </div>
          <Link to="/assistance-requests/new?type=transport">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
            >
              New transportation request
            </Button>
          </Link>
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
          columns={transportColumns}
          dataSource={transportRequests}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No transportation requests yet"
              />
            ),
          }}
        />
      </Card>
    </>
  );
};

export default TransportationPage;
