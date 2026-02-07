import React from "react";
import { Form, Input, Select, DatePicker, FormInstance } from "antd";
import dayjs from "dayjs";
import type { MedicalCaseStatus } from "@/types/assistance-request";

const MEDICAL_CASE_STATUSES: { value: MedicalCaseStatus; label: string }[] = [
  { value: "investigation", label: "Investigation" },
  { value: "hold", label: "Hold" },
  { value: "no_gop", label: "No GOP" },
  { value: "gop_sent", label: "GOP Sent" },
  { value: "done", label: "Done" },
  { value: "closed", label: "Closed" },
  { value: "canceled", label: "Canceled" },
];

export interface MedicalCaseRequestFormValues {
  requestNumber?: string;
  status: MedicalCaseStatus;
  receivedAt: string;
  insuranceCompanyReferenceNumber?: string;
  caseProviderReferenceNumber?: string;
  admissionDate?: string;
  dischargeDate?: string;
  patientName: string;
  patientBirthdate: string;
  patientNationality: string;
  diagnosis?: string;
  notes?: string;
  country?: string;
  city?: string;
  medicalProviderName?: string;
  motherInsuranceCompany?: string;
}

interface MedicalCaseRequestFormProps {
  form: FormInstance;
  initialValues?: Partial<MedicalCaseRequestFormValues>;
  onSubmit: (values: MedicalCaseRequestFormValues) => void;
}

const MedicalCaseRequestForm: React.FC<MedicalCaseRequestFormProps> = ({
  form,
  initialValues,
  onSubmit,
}) => {
  const handleFinish = (values: Record<string, unknown>) => {
    const receivedAt = values.receivedAt
      ? (values.receivedAt as dayjs.Dayjs).toISOString()
      : new Date().toISOString();
    const payload: MedicalCaseRequestFormValues = {
      status: (values.status as MedicalCaseStatus) ?? "investigation",
      receivedAt,
      patientName: (values.patientName as string) ?? "",
      patientBirthdate: values.patientBirthdate
        ? (values.patientBirthdate as dayjs.Dayjs).format("YYYY-MM-DD")
        : "",
      patientNationality: (values.patientNationality as string) ?? "",
      requestNumber: values.requestNumber as string | undefined,
      insuranceCompanyReferenceNumber:
        values.insuranceCompanyReferenceNumber as string | undefined,
      caseProviderReferenceNumber:
        values.caseProviderReferenceNumber as string | undefined,
      admissionDate: values.admissionDate
        ? (values.admissionDate as dayjs.Dayjs).format("YYYY-MM-DD")
        : undefined,
      dischargeDate: values.dischargeDate
        ? (values.dischargeDate as dayjs.Dayjs).format("YYYY-MM-DD")
        : undefined,
      diagnosis: values.diagnosis as string | undefined,
      notes: values.notes as string | undefined,
      country: values.country as string | undefined,
      city: values.city as string | undefined,
      medicalProviderName: values.medicalProviderName as string | undefined,
      motherInsuranceCompany: values.motherInsuranceCompany as string | undefined,
    };
    onSubmit(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        status: "investigation",
        receivedAt: dayjs(),
        ...initialValues,
        admissionDate: initialValues?.admissionDate
          ? dayjs(initialValues.admissionDate)
          : undefined,
        dischargeDate: initialValues?.dischargeDate
          ? dayjs(initialValues.dischargeDate)
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
        <Input placeholder="e.g. MC-2025-004" />
      </Form.Item>
      <Form.Item name="status" label="Status" rules={[{ required: true }]}>
        <Select options={MEDICAL_CASE_STATUSES} placeholder="Select status" />
      </Form.Item>
      <Form.Item
        name="receivedAt"
        label="Received at"
        rules={[{ required: true, message: "Required" }]}
      >
        <DatePicker showTime style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="insuranceCompanyReferenceNumber" label="Insurance company reference number">
        <Input placeholder="e.g. BIA-2025-003" />
      </Form.Item>
      <Form.Item name="caseProviderReferenceNumber" label="Case provider reference number">
        <Input />
      </Form.Item>
      <Form.Item name="admissionDate" label="Admission date">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="dischargeDate" label="Discharge date">
        <DatePicker style={{ width: "100%" }} />
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

      <Form.Item name="diagnosis" label="Diagnosis">
        <Input.TextArea rows={2} placeholder="Medical diagnosis" />
      </Form.Item>
      <Form.Item name="country" label="Country">
        <Input placeholder="e.g. Egypt" />
      </Form.Item>
      <Form.Item name="city" label="City">
        <Input placeholder="e.g. Cairo" />
      </Form.Item>
      <Form.Item name="medicalProviderName" label="Medical provider (facility name)">
        <Input placeholder="Hospital or clinic name" />
      </Form.Item>
      <Form.Item name="motherInsuranceCompany" label="Mother / insurer company">
        <Input placeholder="Insurance company name" />
      </Form.Item>
      <Form.Item name="notes" label="Notes">
        <Input.TextArea rows={3} placeholder="Additional notes" />
      </Form.Item>
    </Form>
  );
};

export default MedicalCaseRequestForm;
