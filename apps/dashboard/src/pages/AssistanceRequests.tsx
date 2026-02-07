import React, { useMemo, useState } from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Table,
  Row,
  Col,
  Button,
  Tag,
  Empty,
  Drawer,
  Form,
} from "antd";
import {
  HomeOutlined,
  SolutionOutlined,
  CarOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { primaryColor } from "@/theme/constants";
import {
  useAssistanceRequestsQuery,
  useAddMedicalCaseRequestCommand,
  useAddTransportRequestCommand,
} from "@/services/assistance-requests";
import MedicalCaseRequestForm, {
  type MedicalCaseRequestFormValues,
} from "@/components/forms/MedicalCaseRequestForm";
import TransportAssistanceRequestForm, {
  type TransportAssistanceRequestFormValues,
} from "@/components/forms/TransportAssistanceRequestForm";
import type {
  TransportAssistanceRequest,
  MedicalCaseAssistanceRequest,
} from "@/types/assistance-request";

const { Title, Text } = Typography;

const AssistanceRequests: React.FC = () => {
  const { pathname } = useLocation();
  const tab = pathname.endsWith("/medical-cases")
    ? "medical-cases"
    : "transportation";

  const [medicalDrawerOpen, setMedicalDrawerOpen] = useState(false);
  const [transportDrawerOpen, setTransportDrawerOpen] = useState(false);
  const [medicalForm] = Form.useForm();
  const [transportForm] = Form.useForm();

  const { data: requests = [], isLoading, error } = useAssistanceRequestsQuery();
  const { addMutation: addMedicalMutation } = useAddMedicalCaseRequestCommand();
  const { addMutation: addTransportMutation } = useAddTransportRequestCommand();

  const transportRequests = useMemo(
    () => requests.filter((r): r is TransportAssistanceRequest => r.type === "transport"),
    [requests]
  );
  const medicalCaseRequests = useMemo(
    () =>
      requests.filter(
        (r): r is MedicalCaseAssistanceRequest => r.type === "medical_case"
      ),
    [requests]
  );

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

  const handleAddMedicalCase = (values: MedicalCaseRequestFormValues) => {
    addMedicalMutation.mutate(values, {
      onSuccess: () => {
        medicalForm.resetFields();
        setMedicalDrawerOpen(false);
      },
    });
  };

  const handleAddTransport = (values: TransportAssistanceRequestFormValues) => {
    addTransportMutation.mutate(values, {
      onSuccess: () => {
        transportForm.resetFields();
        setTransportDrawerOpen(false);
      },
    });
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

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/" },
            {
              title: (
                <>
                  <SolutionOutlined style={{ marginRight: 4 }} />
                  Assistance Requests
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
              Assistance Requests
            </Title>
            <Text type="secondary">
              Medical cases and transportation requests
            </Text>
          </div>
          {tab === "medical-cases" ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setMedicalDrawerOpen(true)}
              style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
            >
              Add medical case
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setTransportDrawerOpen(true)}
              style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
            >
              Add transportation request
            </Button>
          )}
        </div>
      </div>

      <Drawer
        title="Add medical case request"
        width={520}
        open={medicalDrawerOpen}
        onClose={() => setMedicalDrawerOpen(false)}
        destroyOnClose
        footer={null}
      >
        <MedicalCaseRequestForm
          form={medicalForm}
          onSubmit={handleAddMedicalCase}
        />
        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            onClick={() => medicalForm.submit()}
            loading={addMedicalMutation.isPending}
            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
          >
            Create
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => setMedicalDrawerOpen(false)}>
            Cancel
          </Button>
        </div>
      </Drawer>

      <Drawer
        title="Add transportation request"
        width={520}
        open={transportDrawerOpen}
        onClose={() => setTransportDrawerOpen(false)}
        destroyOnClose
        footer={null}
      >
        <TransportAssistanceRequestForm
          form={transportForm}
          onSubmit={handleAddTransport}
        />
        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            onClick={() => transportForm.submit()}
            loading={addTransportMutation.isPending}
            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
          >
            Create
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => setTransportDrawerOpen(false)}>
            Cancel
          </Button>
        </div>
      </Drawer>

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
        <Row gutter={0}>
          <Col span={12}>
            <Link to="/assistance-requests/medical-cases" style={{ display: "block" }}>
              <Button
                block
                type={tab === "medical-cases" ? "primary" : "default"}
                icon={<MedicineBoxOutlined />}
                style={
                  tab === "medical-cases"
                    ? { backgroundColor: primaryColor, borderColor: primaryColor }
                    : undefined
                }
              >
                Medical cases
                {medicalCaseRequests.length > 0 && (
                  <Tag style={{ marginLeft: 6 }}>{medicalCaseRequests.length}</Tag>
                )}
              </Button>
            </Link>
          </Col>
          <Col span={12}>
            <Link to="/assistance-requests/transportation" style={{ display: "block" }}>
              <Button
                block
                type={tab === "transportation" ? "primary" : "default"}
                icon={<CarOutlined />}
                style={
                  tab === "transportation"
                    ? { backgroundColor: primaryColor, borderColor: primaryColor }
                    : undefined
                }
              >
                Transportation
                {transportRequests.length > 0 && (
                  <Tag style={{ marginLeft: 6 }}>{transportRequests.length}</Tag>
                )}
              </Button>
            </Link>
          </Col>
        </Row>
        <div style={{ marginTop: 16 }}>
          {tab === "medical-cases" ? (
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
        ) : (
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
          )}
        </div>
      </Card>
    </>
  );
};

export default AssistanceRequests;
