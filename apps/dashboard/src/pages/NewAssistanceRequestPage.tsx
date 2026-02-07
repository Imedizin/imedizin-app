import React, { useState, useEffect } from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Button,
  Form,
  Segmented,
  Input,
  DatePicker,
  Select,
  Switch,
  Row,
  Col,
  Divider,
  message,
} from "antd";
import { apiClient } from "@/api/client";
import {
  HomeOutlined,
  SolutionOutlined,
  CarOutlined,
  MedicineBoxOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { primaryColor } from "@/theme/constants";
import {
  useAddTransportRequestCommand,
  useAddMedicalCaseRequestCommand,
  useExtractFromEmailCommand,
} from "@/services/assistance-requests";
import type { ExtractFromEmailResponse } from "@/services/assistance-requests/commands/extract-from-email.command";
import SharedAssistanceRequestFields, {
  type SharedAssistanceRequestFormValues,
  TRANSPORT_ONLY_FIELD_NAMES,
  MEDICAL_CASE_ONLY_FIELD_NAMES,
} from "@/components/forms/SharedAssistanceRequestForm";
import { ExtractFromEmailLoader } from "@/components/ExtractFromEmailLoader";
import type {
  AssistanceRequestType,
  TransportStatus,
  MedicalCaseStatus,
  ModeOfTransportation,
} from "@/types/assistance-request";

const { Text } = Typography;

const TRANSPORT_STATUSES: { value: TransportStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const MEDICAL_CASE_STATUSES: { value: MedicalCaseStatus; label: string }[] = [
  { value: "investigation", label: "Investigation" },
  { value: "hold", label: "Hold" },
  { value: "no_gop", label: "No GOP" },
  { value: "gop_sent", label: "GOP Sent" },
  { value: "done", label: "Done" },
  { value: "closed", label: "Closed" },
  { value: "canceled", label: "Canceled" },
];

const MODES: { value: ModeOfTransportation; label: string }[] = [
  { value: "lemozen", label: "Lemozen" },
  { value: "als", label: "ALS" },
  { value: "bls", label: "BLS" },
];

function getInitialRequestType(searchParams: URLSearchParams): AssistanceRequestType {
  const t = searchParams.get("type");
  return t === "medical_case" || t === "transport" ? t : "transport";
}

const NewAssistanceRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailId = searchParams.get("emailId") ?? undefined;

  const [requestType, setRequestType] = useState<AssistanceRequestType>(
    () => getInitialRequestType(searchParams)
  );
  const [form] = Form.useForm();
  const { addMutation: addTransportMutation } = useAddTransportRequestCommand();
  const { addMutation: addMedicalMutation } = useAddMedicalCaseRequestCommand();
  const { extractMutation } = useExtractFromEmailCommand();

  useEffect(() => {
    if (!emailId) return;
    const typeFromUrl = searchParams.get("type");
    const type =
      typeFromUrl === "transport" || typeFromUrl === "medical_case"
        ? typeFromUrl
        : undefined;
    extractMutation.mutate({ emailId, type });
  }, [emailId, searchParams]);

  useEffect(() => {
    if (!extractMutation.isSuccess || !extractMutation.data) return;
    const data = extractMutation.data;
    form.setFieldsValue({
      requestNumber: data.requestNumber,
      receivedAt: data.receivedAt ? dayjs(data.receivedAt) : undefined,
      insuranceCompanyReferenceNumber: data.insuranceCompanyReferenceNumber,
      patientName: data.patientName,
      patientBirthdate: data.patientBirthdate
        ? dayjs(data.patientBirthdate)
        : undefined,
      patientNationality: data.patientNationality,
      diagnosis: data.diagnosis,
      notes: data.notes,
      // Transportation details (when extracted from email)
      pickupPoint: data.pickupPoint,
      dropOffPoint: data.dropoffPoint,
      dateOfRequestedTransportation: data.dateOfRequestedTransportation
        ? dayjs(data.dateOfRequestedTransportation)
        : undefined,
      estimatedPickupTime: data.estimatedPickupTime
        ? dayjs(data.estimatedPickupTime)
        : undefined,
      estimatedDropOffTime: data.estimatedDropoffTime
        ? dayjs(data.estimatedDropoffTime)
        : undefined,
      modeOfTransportation: data.modeOfTransport,
      withEscortingMedicalCrew: data.medicalCrewRequired ?? false,
      hasCompanion: data.hasCompanion ?? false,
      // Medical case details (when extracted from email)
      caseProviderReferenceNumber: data.caseProviderReferenceNumber,
      admissionDate: data.admissionDate
        ? dayjs(data.admissionDate)
        : undefined,
      dischargeDate: data.dischargeDate
        ? dayjs(data.dischargeDate)
        : undefined,
      country: data.country,
      city: data.city,
      medicalProviderName: data.medicalProviderName,
      motherInsuranceCompany: data.motherInsuranceCompany,
    });
    if (
      data.requestType === "transport" ||
      data.requestType === "medical_case"
    ) {
      setRequestType(data.requestType);
    }
  }, [extractMutation.isSuccess, extractMutation.data, form]);

  const isTransport = requestType === "transport";
  const isPending =
    addTransportMutation.isPending || addMedicalMutation.isPending;
  const isExtracting = Boolean(emailId) && extractMutation.isPending;

  const handleRequestTypeChange = (v: AssistanceRequestType) => {
    const toClear =
      v === "transport"
        ? MEDICAL_CASE_ONLY_FIELD_NAMES
        : TRANSPORT_ONLY_FIELD_NAMES;
    form.setFieldsValue(
      toClear.reduce((acc, name) => ({ ...acc, [name]: undefined }), {})
    );
    setRequestType(v);
  };

  const handleSubmit = (values: Record<string, unknown>) => {
    const receivedAt = values.receivedAt
      ? (values.receivedAt as dayjs.Dayjs).toISOString()
      : new Date().toISOString();
    const shared = {
      requestNumber: (values.requestNumber as string) ?? "",
      receivedAt,
      insuranceCompanyReferenceNumber:
        values.insuranceCompanyReferenceNumber as string | undefined,
      patientName: (values.patientName as string) ?? "",
      patientBirthdate: values.patientBirthdate
        ? (values.patientBirthdate as dayjs.Dayjs).format("YYYY-MM-DD")
        : undefined,
      patientNationality: values.patientNationality as string | undefined,
      diagnosis: values.diagnosis as string | undefined,
      notes: values.notes as string | undefined,
    };

    if (isTransport) {
      addTransportMutation.mutate(
        {
          ...shared,
          status: (values.status as TransportStatus) ?? "pending",
          pickupPoint: (values.pickupPoint as string) ?? "To be confirmed",
          dropOffPoint: (values.dropOffPoint as string) ?? "To be confirmed",
          dateOfRequestedTransportation: values.dateOfRequestedTransportation
            ? (values.dateOfRequestedTransportation as dayjs.Dayjs).format(
                "YYYY-MM-DD"
              )
            : undefined,
          estimatedPickupTime: values.estimatedPickupTime
            ? (values.estimatedPickupTime as dayjs.Dayjs).toISOString()
            : undefined,
          estimatedDropOffTime: values.estimatedDropOffTime
            ? (values.estimatedDropOffTime as dayjs.Dayjs).toISOString()
            : undefined,
          modeOfTransportation: values.modeOfTransportation as
            | ModeOfTransportation
            | undefined,
          withEscortingMedicalCrew: Boolean(values.withEscortingMedicalCrew),
          hasCompanion: Boolean(values.hasCompanion),
        },
        {
          onSuccess: async (created) => {
            const threadId = extractMutation.data?.threadId;
            if (threadId) {
              try {
                await apiClient.post(`assistance-requests/${created.id}/threads`, {
                  json: { threadId },
                });
              } catch {
                message.warning(
                  "Request created but could not link to email thread"
                );
              }
            }
            navigate(`/assistance-requests/transportation/${created.id}`, {
              state: { request: created },
            });
          },
        }
      );
    } else {
      addMedicalMutation.mutate(
        {
          ...shared,
          status: (values.status as MedicalCaseStatus) ?? "investigation",
          patientBirthdate: shared.patientBirthdate ?? "",
          patientNationality: shared.patientNationality ?? "",
          caseProviderReferenceNumber: values.caseProviderReferenceNumber as
            | string
            | undefined,
          admissionDate: values.admissionDate
            ? (values.admissionDate as dayjs.Dayjs).format("YYYY-MM-DD")
            : undefined,
          dischargeDate: values.dischargeDate
            ? (values.dischargeDate as dayjs.Dayjs).format("YYYY-MM-DD")
            : undefined,
          country: values.country as string | undefined,
          city: values.city as string | undefined,
          medicalProviderName: values.medicalProviderName as string | undefined,
          motherInsuranceCompany: values.motherInsuranceCompany as
            | string
            | undefined,
        },
        {
          onSuccess: async (created) => {
            const threadId = extractMutation.data?.threadId;
            if (threadId) {
              try {
                await apiClient.post(`assistance-requests/${created.id}/threads`, {
                  json: { threadId },
                });
              } catch {
                message.warning(
                  "Request created but could not link to email thread"
                );
              }
            }
            navigate(`/assistance-requests/medical-cases/${created.id}`, {
              state: { request: created },
            });
          },
        }
      );
    }
  };

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
            { title: "New request" },
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
              onClick={() => navigate("/assistance-requests/transportation")}
              style={{ marginBottom: 8, paddingLeft: 0 }}
            >
              Back to list
            </Button>
            <Typography.Title level={3} style={{ margin: "0 0 4px 0" }}>
              New assistance request
            </Typography.Title>
            {emailId && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                From email
              </Text>
            )}
          </div>
        </div>
      </div>

      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}
      >
        {isExtracting && <ExtractFromEmailLoader />}
        <div style={{ position: "relative" }}>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              receivedAt: dayjs(),
              status: "pending",
              withEscortingMedicalCrew: false,
              hasCompanion: false,
            }}
            onFinish={handleSubmit}
          >
            <Form.Item label="Request type" style={{ marginBottom: 24 }}>
              <Segmented
                value={requestType}
                onChange={(v) =>
                  handleRequestTypeChange(v as AssistanceRequestType)
                }
                options={[
                  {
                    label: (
                      <span>
                        <CarOutlined style={{ marginRight: 6 }} />
                        Transportation
                      </span>
                    ),
                    value: "transport",
                  },
                  {
                    label: (
                      <span>
                        <MedicineBoxOutlined style={{ marginRight: 6 }} />
                        Medical case
                      </span>
                    ),
                    value: "medical_case",
                  },
                ]}
              />
            </Form.Item>

            <Text
              type="secondary"
              strong
              style={{ display: "block", marginBottom: 12 }}
            >
              Shared details
            </Text>
            <SharedAssistanceRequestFields
              requestNumberPlaceholder={
                isTransport ? "e.g. TR-2025-004" : "e.g. MC-2025-004"
              }
            />

            {isTransport && (
              <>
                <Divider style={{ marginTop: 24, marginBottom: 16 }}>
                  <CarOutlined style={{ marginRight: 8 }} />
                  Transportation details
                </Divider>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="pickupPoint"
                      label="Pickup point"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="Full pickup address"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="dropOffPoint"
                      label="Drop-off point"
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="Full drop-off address"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="dateOfRequestedTransportation"
                      label="Date of requested transportation"
                    >
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="estimatedPickupTime"
                      label="Estimated pickup time"
                    >
                      <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="estimatedDropOffTime"
                      label="Estimated drop-off time"
                    >
                      <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="modeOfTransportation"
                      label="Mode of transportation"
                    >
                      <Select
                        options={MODES}
                        placeholder="Lemozen, ALS, BLS"
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="withEscortingMedicalCrew"
                      label="Escorting medical crew"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="hasCompanion"
                      label="Companion"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            {!isTransport && (
              <>
                <Divider style={{ marginTop: 24, marginBottom: 16 }}>
                  <MedicineBoxOutlined style={{ marginRight: 8 }} />
                  Medical case details
                </Divider>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="caseProviderReferenceNumber"
                      label="Case provider reference number"
                    >
                      <Input placeholder="Reference from case provider" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="admissionDate" label="Admission date">
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="dischargeDate" label="Discharge date">
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="country" label="Country">
                      <Input placeholder="e.g. Egypt" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="city" label="City">
                      <Input placeholder="e.g. Cairo" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="medicalProviderName"
                      label="Medical provider (facility name)"
                    >
                      <Input placeholder="Hospital or clinic name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="motherInsuranceCompany"
                      label="Mother / insurer company"
                    >
                      <Input placeholder="Insurance company name" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isPending}
                style={{
                  backgroundColor: primaryColor,
                  borderColor: primaryColor,
                }}
              >
                Create
              </Button>
              <Button
                onClick={() => navigate("/assistance-requests/transportation")}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </div>
      </Card>
    </>
  );
};

export default NewAssistanceRequestPage;
