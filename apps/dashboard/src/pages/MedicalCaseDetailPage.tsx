import React from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Descriptions,
  Tag,
  Button,
  Spin,
  Space,
} from "antd";
import {
  HomeOutlined,
  SolutionOutlined,
  MedicineBoxOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useAssistanceRequestsQuery,
  useAssistanceRequestByIdQuery,
} from "@/services/assistance-requests";
import { LinkedThreadsCard } from "@/components/assistance-requests/LinkedThreadsCard";
import {
  isMedicalCaseRequest,
  type MedicalCaseAssistanceRequest,
} from "@/types/assistance-request";
const { Title, Text } = Typography;

const medicalCaseStatusColors: Record<string, string> = {
  canceled: "error",
  cancelled: "error",
  closed: "success",
  done: "success",
  gop_sent: "processing",
  no_gop: "warning",
  investigation: "warning",
  hold: "warning",
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString();
};

const MedicalCaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: requests = [], isLoading: listLoading } = useAssistanceRequestsQuery();
  const { data: byIdRequest, isLoading: byIdLoading } = useAssistanceRequestByIdQuery(id);

  const requestFromState = location.state?.request as
    | MedicalCaseAssistanceRequest
    | undefined;
  const requestFromList = requests.find(
    (r) => r.id === id && isMedicalCaseRequest(r)
  ) as MedicalCaseAssistanceRequest | undefined;
  const requestFromApi =
    byIdRequest && isMedicalCaseRequest(byIdRequest) ? byIdRequest : undefined;
  const request = requestFromApi ?? requestFromState ?? requestFromList;
  const isLoading = listLoading || byIdLoading;

  if (!id) {
    return (
      <Card>
        <Text type="danger">Invalid request: no ID provided.</Text>
        <div style={{ marginTop: 16 }}>
          <Button
            type="link"
            onClick={() => navigate("/assistance-requests/medical-cases")}
          >
            Back to list
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading && !requestFromState) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading medical case…</Text>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <Card>
        <Text type="danger">Medical case request not found.</Text>
        <div style={{ marginTop: 16 }}>
          <Button
            type="link"
            onClick={() => navigate("/assistance-requests/medical-cases")}
          >
            Back to list
          </Button>
        </div>
      </Card>
    );
  }

  const r = request;

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/" },
            {
              title: (
                <Link to="/assistance-requests/medical-cases">
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
            { title: r.requestNumber },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/assistance-requests/medical-cases")}
              style={{ marginBottom: 8, paddingLeft: 0 }}
            >
              Back to list
            </Button>
            <Title level={3} style={{ margin: "0 0 4px 0" }}>
              {r.requestNumber}
            </Title>
            <Tag color={medicalCaseStatusColors[r.status] ?? "default"}>
              {r.status.replace("_", " ").toUpperCase()}
            </Tag>
          </div>
        </div>
      </div>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <LinkedThreadsCard requestId={r.id} linkedThreads={r.linkedThreads ?? []} />

        <Card
          title="Request & references"
          bordered={false}
          style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
        >
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered size="middle">
            <Descriptions.Item label="Request number">
              <Text strong>{r.requestNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={medicalCaseStatusColors[r.status] ?? "default"}>
                {r.status.replace("_", " ").toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Case provider reference number">
              {r.caseProviderReferenceNumber ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Insurance company reference">
              {r.insuranceCompanyReferenceNumber ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Received at">
              {formatDateTime(r.receivedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {formatDateTime(r.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Last updated">
              {formatDateTime(r.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title="Dates"
          bordered={false}
          style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
        >
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered size="middle">
            <Descriptions.Item label="Admission date">
              {formatDate(r.admissionDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Discharge date">
              {formatDate(r.dischargeDate)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title="Patient"
          bordered={false}
          style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
        >
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered size="middle">
            <Descriptions.Item label="Patient name">
              <Text strong>{r.patient.patientName || "—"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Birthdate">
              {formatDate(r.patient.patientBirthdate) || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Nationality">
              {r.patient.patientNationality || "—"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title="Clinical & location"
          bordered={false}
          style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
        >
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered size="middle">
            <Descriptions.Item label="Diagnosis" span={2}>
              {r.diagnosis ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Medical provider">
              {r.medicalProviderName ?? r.medicalProviderId ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Country">
              {r.country ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="City">
              {r.city ?? "—"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title="Insurance"
          bordered={false}
          style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
        >
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="Mother / insurer company">
              {r.motherInsuranceCompany ?? "—"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {r.notes ? (
          <Card
            title="Notes"
            bordered={false}
            style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
          >
            <Text>{r.notes}</Text>
          </Card>
        ) : null}
      </Space>
    </>
  );
};

export default MedicalCaseDetailPage;
