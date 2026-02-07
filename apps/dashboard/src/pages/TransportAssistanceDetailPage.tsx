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
  CarOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useAssistanceRequestsQuery,
  useAssistanceRequestByIdQuery,
} from "@/services/assistance-requests";
import { LinkedThreadsCard } from "@/components/assistance-requests/LinkedThreadsCard";
import {
  isTransportRequest,
  type TransportAssistanceRequest,
} from "@/types/assistance-request";
const { Title, Text } = Typography;

const transportStatusColors: Record<string, string> = {
  draft: "default",
  pending: "processing",
  confirmed: "success",
  in_progress: "warning",
  completed: "success",
  cancelled: "error",
  canceled: "error",
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

const TransportAssistanceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: requests = [], isLoading: listLoading } = useAssistanceRequestsQuery();
  const { data: byIdRequest, isLoading: byIdLoading } = useAssistanceRequestByIdQuery(id);

  const requestFromState = location.state?.request as
    | TransportAssistanceRequest
    | undefined;
  const requestFromList = requests.find(
    (r) => r.id === id && isTransportRequest(r)
  ) as TransportAssistanceRequest | undefined;
  const requestFromApi =
    byIdRequest && isTransportRequest(byIdRequest) ? byIdRequest : undefined;
  const request = requestFromApi ?? requestFromState ?? requestFromList;
  const isLoading = listLoading || byIdLoading;

  if (!id) {
    return (
      <Card>
        <Text type="danger">Invalid request: no ID provided.</Text>
        <div style={{ marginTop: 16 }}>
          <Button
            type="link"
            onClick={() => navigate("/assistance-requests/transportation")}
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
          <Text type="secondary">Loading transportation request…</Text>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <Card>
        <Text type="danger">Transportation request not found.</Text>
        <div style={{ marginTop: 16 }}>
          <Button
            type="link"
            onClick={() => navigate("/assistance-requests/transportation")}
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
                <Link to="/assistance-requests/transportation">
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
            { title: r.requestNumber },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/assistance-requests/transportation")}
              style={{ marginBottom: 8, paddingLeft: 0 }}
            >
              Back to list
            </Button>
            <Title level={3} style={{ margin: "0 0 4px 0" }}>
              {r.requestNumber}
            </Title>
            <Tag color={transportStatusColors[r.status] ?? "default"}>
              {r.status.replace("_", " ").toUpperCase()}
            </Tag>
          </div>
        </div>
      </div>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <LinkedThreadsCard requestId={r.id} linkedThreads={r.linkedThreads ?? []} />

        <Card
          title="Request & timing"
          bordered={false}
          style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
        >
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered size="middle">
            <Descriptions.Item label="Request number">
              <Text strong>{r.requestNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={transportStatusColors[r.status] ?? "default"}>
                {r.status.replace("_", " ").toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Received at">
              {formatDateTime(r.receivedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Date of requested transportation">
              {formatDate(r.dateOfRequestedTransportation)}
            </Descriptions.Item>
            <Descriptions.Item label="Estimated pickup time">
              {formatDateTime(r.estimatedPickupTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Estimated drop-off time">
              {formatDateTime(r.estimatedDropOffTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Insurance company reference">
              {r.insuranceCompanyReferenceNumber ?? "—"}
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
          title="Pickup & drop-off"
          bordered={false}
          style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
        >
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="Pickup point">
              <Text strong>{r.pickupPoint}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Drop-off point">
              <Text strong>{r.dropOffPoint}</Text>
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
          title="Transport & crew"
          bordered={false}
          style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
        >
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered size="middle">
            <Descriptions.Item label="Mode of transportation">
              {r.modeOfTransportation ? (
                <Tag>{String(r.modeOfTransportation).toUpperCase()}</Tag>
              ) : (
                "—"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="With escorting medical crew">
              {r.withEscortingMedicalCrew ? (
                <Tag color="green">Yes</Tag>
              ) : (
                <Tag color="default">No</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Companion">
              {r.hasCompanion ? (
                <Tag color="blue">Yes</Tag>
              ) : (
                <Tag color="default">No</Tag>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {(r.diagnosis || r.notes) ? (
          <Card
            title="Clinical & notes"
            bordered={false}
            style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
          >
            <Descriptions column={1} bordered size="middle">
              {r.diagnosis ? (
                <Descriptions.Item label="Diagnosis">
                  {r.diagnosis}
                </Descriptions.Item>
              ) : null}
              {r.notes ? (
                <Descriptions.Item label="Notes">{r.notes}</Descriptions.Item>
              ) : null}
            </Descriptions>
          </Card>
        ) : null}
      </Space>
    </>
  );
};

export default TransportAssistanceDetailPage;
