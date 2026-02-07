import React from "react";
import { Form, Input, Select, DatePicker, FormInstance, Switch } from "antd";
import dayjs from "dayjs";
import type { TransportStatus, ModeOfTransportation } from "@/types/assistance-request";

const TRANSPORT_STATUSES: { value: TransportStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const MODES: { value: ModeOfTransportation; label: string }[] = [
  { value: "lemozen", label: "Lemozen" },
  { value: "als", label: "ALS" },
  { value: "bls", label: "BLS" },
];

export interface TransportAssistanceRequestFormValues {
  requestNumber?: string;
  status: TransportStatus;
  receivedAt: string;
  pickupPoint: string;
  dropOffPoint: string;
  dateOfRequestedTransportation?: string;
  estimatedPickupTime?: string;
  estimatedDropOffTime?: string;
  insuranceCompanyReferenceNumber?: string;
  patientName: string;
  patientBirthdate?: string;
  patientNationality?: string;
  diagnosis?: string;
  notes?: string;
  modeOfTransportation?: ModeOfTransportation;
  withEscortingMedicalCrew: boolean;
  hasCompanion: boolean;
}

interface TransportAssistanceRequestFormProps {
  form: FormInstance;
  initialValues?: Partial<TransportAssistanceRequestFormValues>;
  onSubmit: (values: TransportAssistanceRequestFormValues) => void;
}

const TransportAssistanceRequestForm: React.FC<
  TransportAssistanceRequestFormProps
> = ({ form, initialValues, onSubmit }) => {
  const handleFinish = (values: Record<string, unknown>) => {
    const receivedAt = values.receivedAt
      ? (values.receivedAt as dayjs.Dayjs).toISOString()
      : new Date().toISOString();
    const payload: TransportAssistanceRequestFormValues = {
      status: (values.status as TransportStatus) ?? "pending",
      receivedAt,
      pickupPoint: (values.pickupPoint as string) ?? "",
      dropOffPoint: (values.dropOffPoint as string) ?? "",
      patientName: (values.patientName as string) ?? "",
      patientBirthdate: values.patientBirthdate
        ? (values.patientBirthdate as dayjs.Dayjs).format("YYYY-MM-DD")
        : undefined,
      patientNationality: values.patientNationality as string | undefined,
      withEscortingMedicalCrew: Boolean(values.withEscortingMedicalCrew),
      hasCompanion: Boolean(values.hasCompanion),
      requestNumber: values.requestNumber as string | undefined,
      insuranceCompanyReferenceNumber:
        values.insuranceCompanyReferenceNumber as string | undefined,
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
      diagnosis: values.diagnosis as string | undefined,
      notes: values.notes as string | undefined,
      modeOfTransportation: values.modeOfTransportation as
        | ModeOfTransportation
        | undefined,
    };
    onSubmit(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        status: "pending",
        receivedAt: dayjs(),
        withEscortingMedicalCrew: false,
        hasCompanion: false,
        ...initialValues,
        dateOfRequestedTransportation: initialValues?.dateOfRequestedTransportation
          ? dayjs(initialValues.dateOfRequestedTransportation)
          : undefined,
        estimatedPickupTime: initialValues?.estimatedPickupTime
          ? dayjs(initialValues.estimatedPickupTime)
          : undefined,
        estimatedDropOffTime: initialValues?.estimatedDropOffTime
          ? dayjs(initialValues.estimatedDropOffTime)
          : undefined,
        patientBirthdate: initialValues?.patientBirthdate
          ? dayjs(initialValues.patientBirthdate)
          : undefined,
      }}
      onFinish={handleFinish}
    >
      <Form.Item
        name="requestNumber"
        label="Request number"
        rules={[{ required: true, message: "Required" }]}
      >
        <Input placeholder="e.g. TR-2025-004" />
      </Form.Item>
      <Form.Item name="status" label="Status" rules={[{ required: true }]}>
        <Select options={TRANSPORT_STATUSES} placeholder="Select status" />
      </Form.Item>
      <Form.Item
        name="receivedAt"
        label="Received at"
        rules={[{ required: true, message: "Required" }]}
      >
        <DatePicker showTime style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="insuranceCompanyReferenceNumber" label="Insurance company reference number">
        <Input />
      </Form.Item>
      <Form.Item
        name="pickupPoint"
        label="Pickup point"
        rules={[{ required: true, message: "Required" }]}
      >
        <Input.TextArea rows={2} placeholder="Full pickup address" />
      </Form.Item>
      <Form.Item
        name="dropOffPoint"
        label="Drop-off point"
        rules={[{ required: true, message: "Required" }]}
      >
        <Input.TextArea rows={2} placeholder="Full drop-off address" />
      </Form.Item>
      <Form.Item name="dateOfRequestedTransportation" label="Date of requested transportation">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="estimatedPickupTime" label="Estimated pickup time">
        <DatePicker showTime style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="estimatedDropOffTime" label="Estimated drop-off time">
        <DatePicker showTime style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        name="patientName"
        label="Patient name"
        rules={[{ required: true, message: "Required" }]}
      >
        <Input placeholder="Full name" />
      </Form.Item>
      <Form.Item name="patientBirthdate" label="Patient birthdate">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="patientNationality" label="Patient nationality">
        <Input placeholder="e.g. Egyptian" />
      </Form.Item>

      <Form.Item name="modeOfTransportation" label="Mode of transportation">
        <Select options={MODES} placeholder="Lemozen, ALS, BLS" allowClear />
      </Form.Item>
      <Form.Item
        name="withEscortingMedicalCrew"
        label="With escorting medical crew"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item name="hasCompanion" label="Companion" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item name="diagnosis" label="Diagnosis">
        <Input.TextArea rows={2} placeholder="Medical diagnosis if applicable" />
      </Form.Item>
      <Form.Item name="notes" label="Notes">
        <Input.TextArea rows={2} placeholder="Additional notes" />
      </Form.Item>
    </Form>
  );
};

export default TransportAssistanceRequestForm;
