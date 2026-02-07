import React from "react";
import { Form, Input, DatePicker, Row, Col } from "antd";

/**
 * Shared assistance request form values (base fields for both transport and medical case).
 * Aligns with AssistanceRequestBase in @/types/assistance-request.
 */
export interface SharedAssistanceRequestFormValues {
  requestNumber: string;
  receivedAt: string;
  insuranceCompanyReferenceNumber?: string;
  patientName: string;
  patientBirthdate?: string;
  patientNationality?: string;
  diagnosis?: string;
  notes?: string;
}

/** Field names for type-specific sections (so parent can clear them when switching type). */
export const TRANSPORT_ONLY_FIELD_NAMES = [
  "pickupPoint",
  "dropOffPoint",
  "dateOfRequestedTransportation",
  "estimatedPickupTime",
  "estimatedDropOffTime",
  "modeOfTransportation",
  "withEscortingMedicalCrew",
  "hasCompanion",
] as const;

export const MEDICAL_CASE_ONLY_FIELD_NAMES = [
  "caseProviderReferenceNumber",
  "admissionDate",
  "dischargeDate",
  "country",
  "city",
  "medicalProviderName",
  "motherInsuranceCompany",
] as const;

interface SharedAssistanceRequestFieldsProps {
  requestNumberPlaceholder?: string;
}

/**
 * Renders only the shared form fields. Must be used inside a parent <Form>.
 * Type-specific fields are rendered by the parent based on request type.
 */
const SharedAssistanceRequestFields: React.FC<
  SharedAssistanceRequestFieldsProps
> = ({ requestNumberPlaceholder = "e.g. TR-2025-004 or MC-2025-004" }) => (
  <>
    <Row gutter={16}>
      <Col xs={24} sm={24} md={12}>
        <Form.Item
          name="requestNumber"
          label="Request number"
          rules={[{ required: true, message: "Required" }]}
        >
          <Input placeholder={requestNumberPlaceholder} />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={12}>
        <Form.Item
          name="receivedAt"
          label="Received at"
          rules={[{ required: true, message: "Required" }]}
        >
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col xs={24} sm={24} md={12}>
        <Form.Item
          name="insuranceCompanyReferenceNumber"
          label="Insurance company reference number"
        >
          <Input placeholder="e.g. BIA-2025-003" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={12}>
        <Form.Item name="patientNationality" label="Patient nationality">
          <Input placeholder="e.g. Egyptian" />
        </Form.Item>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col xs={24} sm={24} md={12}>
        <Form.Item
          name="patientName"
          label="Patient name"
          rules={[{ required: true, message: "Required" }]}
        >
          <Input placeholder="Full name" />
        </Form.Item>
      </Col>
      <Col xs={24} sm={24} md={12}>
        <Form.Item name="patientBirthdate" label="Patient birthdate">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
      </Col>
    </Row>

    <Form.Item name="diagnosis" label="Diagnosis">
      <Input.TextArea rows={2} placeholder="Medical diagnosis" />
    </Form.Item>
    <Form.Item name="notes" label="Notes">
      <Input.TextArea rows={3} placeholder="Additional notes" />
    </Form.Item>
  </>
);

export default SharedAssistanceRequestFields;
