import React, { useState } from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Descriptions,
  Tag,
  Button,
  Spin,
  Row,
  Col,
  Modal,
  Form,
} from "antd";
import {
  HomeOutlined,
  SolutionOutlined,
  MedicineBoxOutlined,
  ArrowLeftOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import {
  useAssistanceRequestsQuery,
  useAssistanceRequestByIdQuery,
  useUpdateMedicalCaseRequestCommand,
} from "@/services/assistance-requests";
import { LinkedThreadsCard } from "@/components/assistance-requests/LinkedThreadsCard";
import MedicalCaseRequestForm from "@/components/forms/MedicalCaseRequestForm";
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { data: requests = [], isLoading: listLoading } = useAssistanceRequestsQuery();
  const { data: byIdRequest, isLoading: byIdLoading } = useAssistanceRequestByIdQuery(id);
  const { updateMutation } = useUpdateMedicalCaseRequestCommand(id ?? "");

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
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              form.setFieldsValue({
                requestNumber: r.requestNumber,
                status: r.status,
                receivedAt: r.receivedAt ? dayjs(r.receivedAt) : undefined,
                patientName: r.patient.patientName,
                patientBirthdate: r.patient.patientBirthdate
                  ? dayjs(r.patient.patientBirthdate)
                  : undefined,
                patientNationality: r.patient.patientNationality,
                insuranceCompanyReferenceNumber: r.insuranceCompanyReferenceNumber,
                caseProviderReferenceNumber: r.caseProviderReferenceNumber,
                admissionDate: r.admissionDate ? dayjs(r.admissionDate) : undefined,
                dischargeDate: r.dischargeDate ? dayjs(r.dischargeDate) : undefined,
                diagnosis: r.diagnosis ?? undefined,
                country: r.country ?? undefined,
                city: r.city ?? undefined,
                medicalProviderName: r.medicalProviderName ?? undefined,
                motherInsuranceCompany: r.motherInsuranceCompany ?? undefined,
              });
              setEditModalOpen(true);
            }}
          >
            Edit
          </Button>
        </div>
      </div>

      <Modal
        title="Edit medical case request"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <MedicalCaseRequestForm
          form={form}
          initialValues={{
            requestNumber: r.requestNumber,
            status: r.status,
            receivedAt: r.receivedAt,
            patientName: r.patient.patientName,
            patientBirthdate: r.patient.patientBirthdate,
            patientNationality: r.patient.patientNationality,
            insuranceCompanyReferenceNumber: r.insuranceCompanyReferenceNumber,
            caseProviderReferenceNumber: r.caseProviderReferenceNumber,
            admissionDate: r.admissionDate,
            dischargeDate: r.dischargeDate,
            diagnosis: r.diagnosis ?? undefined,
            country: r.country ?? undefined,
            city: r.city ?? undefined,
            medicalProviderName: r.medicalProviderName ?? undefined,
            motherInsuranceCompany: r.motherInsuranceCompany ?? undefined,
          }}
          onSubmit={(values) => {
            updateMutation.mutate(values, {
              onSuccess: () => setEditModalOpen(false),
            });
          }}
        />
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Button onClick={() => setEditModalOpen(false)} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={updateMutation.isPending}
            onClick={() => form.submit()}
          >
            Save
          </Button>
        </div>
      </Modal>

      <Row gutter={[24, 24]} wrap>
        <Col xs={24} lg={16}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card
              title="Request & references"
              bordered={false}
              style={{ borderRadius: 12, boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
            >
              <Descriptions column={1} bordered size="middle">
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
              <Descriptions column={1} bordered size="middle">
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
              <Descriptions column={1} bordered size="middle">
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
              <Descriptions column={1} bordered size="middle">
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
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div style={{ position: "sticky", top: 88 }}>
            <LinkedThreadsCard requestId={r.id} linkedThreads={r.linkedThreads ?? []} />
          </div>
        </Col>
      </Row>
    </>
  );
};

export default MedicalCaseDetailPage;
