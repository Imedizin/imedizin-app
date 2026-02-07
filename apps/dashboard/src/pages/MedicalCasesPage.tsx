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
  MedicineBoxOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { primaryColor } from "@/theme/constants";
import { useAssistanceRequestsQuery } from "@/services/assistance-requests";
import type { MedicalCaseAssistanceRequest } from "@/types/assistance-request";

const { Title, Text } = Typography;

const getMedicalCaseStatusColor = (status: string) => {
  switch (status) {
    case "canceled":
    case "cancelled":
      return "error";
    case "closed":
    case "done":
      return "success";
    case "gop_sent":
      return "processing";
    case "no_gop":
    case "investigation":
    case "hold":
      return "warning";
    default:
      return "default";
  }
};

const medicalCaseColumns: ColumnsType<MedicalCaseAssistanceRequest> = [
  {
    title: "Request number",
    dataIndex: "requestNumber",
    key: "requestNumber",
    render: (text: string, record: MedicalCaseAssistanceRequest) => (
      <Link
        to={`/assistance-requests/medical-cases/${record.id}`}
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
    title: "Patient",
    key: "patient",
    render: (_: unknown, record: MedicalCaseAssistanceRequest) =>
      record.patient?.patientName || "—",
  },
  {
    title: "Diagnosis",
    dataIndex: "diagnosis",
    key: "diagnosis",
    ellipsis: true,
    render: (d: string | null) => d || "—",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: string) => (
      <Tag color={getMedicalCaseStatusColor(status)}>
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

const MedicalCasesPage: React.FC = () => {
  const { data: requests = [], isLoading, error } = useAssistanceRequestsQuery();

  const medicalCaseRequests = useMemo(
    () =>
      requests.filter(
        (r): r is MedicalCaseAssistanceRequest => r.type === "medical_case"
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
                  <MedicineBoxOutlined style={{ marginRight: 4 }} />
                  Medical cases
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
              Medical cases
            </Title>
            <Text type="secondary">
              Medical case assistance requests
            </Text>
          </div>
          <Link to="/assistance-requests/new?type=medical_case">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
            >
              New medical case
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
          columns={medicalCaseColumns}
          dataSource={medicalCaseRequests}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No medical case requests yet"
              />
            ),
          }}
        />
      </Card>
    </>
  );
};

export default MedicalCasesPage;
