import React, { useEffect } from "react";
import { Form, Input, Select, DatePicker, Row, Col } from "antd";
import type { FormInstance } from "antd/es/form";
import dayjs from "dayjs";
import { OPERATING_REGIONS } from "@/constants/operating-regions";

const { Option } = Select;
const { RangePicker } = DatePicker;

import type {
  CaseProvider,
  CreateCaseProviderDto,
} from "@/types/case-provider";

/** Form values use camelCase to match API. Range picker uses contractDateRange. */
export interface CaseProviderFormData extends CreateCaseProviderDto {
  contractDateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null;
}

interface CaseProviderFormProps {
  form: FormInstance;
  initialValues?: Partial<CaseProvider>;
  onSubmit: (values: CreateCaseProviderDto) => void;
}

const CaseProviderForm: React.FC<CaseProviderFormProps> = ({
  form,
  initialValues,
  onSubmit,
}) => {
  const handleFinish = (values: CaseProviderFormData) => {
    const range = values.contractDateRange;
    const payload: CreateCaseProviderDto = {
      companyName: values.companyName,
      providerType: values.providerType,
      operatingRegions: values.operatingRegions ?? [],
      primaryEmail: values.primaryEmail,
      primaryPhone: values.primaryPhone,
      status: values.status,
      contractStartDate: range?.[0]?.format?.("YYYY-MM-DD") ?? null,
      contractEndDate: range?.[1]?.format?.("YYYY-MM-DD") ?? null,
      pricingModel: values.pricingModel ?? null,
      slaTier: values.slaTier ?? null,
      tags: values.tags ?? [],
    };
    onSubmit(payload);
  };

  // Update form values when initialValues change (for editing)
  useEffect(() => {
    if (initialValues) {
      const start = initialValues.contractStartDate
        ? dayjs(initialValues.contractStartDate)
        : null;
      const end = initialValues.contractEndDate
        ? dayjs(initialValues.contractEndDate)
        : null;
      const contractDateRange =
        start && end ? [start, end] : undefined;
      form.setFieldsValue({
        ...initialValues,
        contractDateRange,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: "active" });
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        status: "active",
      }}
    >
      <div className="form-section">
        <div className="form-section-title">Identity (Mandatory)</div>
        <Row gutter={16}>
          <Col xs={24} md={14}>
            <Form.Item
              name="companyName"
              label="Company Name"
              rules={[{ required: true, message: "Please enter company name" }]}
            >
              <Input placeholder="Enter company name" />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item
              name="providerType"
              label="Provider Type"
              rules={[{ required: true, message: "Please select provider type" }]}
            >
              <Select placeholder="Select provider type">
                <Option value="internal">Internal</Option>
                <Option value="external">External</Option>
                <Option value="TPA">TPA</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="operatingRegions"
          label="Operating Regions"
          rules={[
            {
              required: true,
              message: "Please select at least one operating region",
            },
          ]}
          tooltip="Select one or more regions"
        >
          <Select
            mode="multiple"
            placeholder="Select operating regions"
            style={{ width: "100%" }}
            allowClear
            showSearch
            optionFilterProp="label"
            options={OPERATING_REGIONS.map((region) => ({
              value: region,
              label: region,
            }))}
          />
        </Form.Item>
      </div>

      <div className="form-section">
        <div className="form-section-title">Contact (Mandatory)</div>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="primaryEmail"
              label="Primary Email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="Enter email address" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="primaryPhone"
              label="Primary Phone"
              rules={[{ required: true, message: "Please enter phone number" }]}
            >
              <Input placeholder="Enter phone number" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div className="form-section">
        <div className="form-section-title">Status & Audit (Mandatory)</div>
        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: "Please select status" }]}
        >
          <Select placeholder="Select status">
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
          </Select>
        </Form.Item>
      </div>

      <div className="form-section">
        <div className="form-section-title">Commercial (Optional)</div>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="contractDateRange"
              label="Contract period"
              tooltip="Start and end date of the contract"
            >
              <RangePicker
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                placeholder={["Start date", "End date"]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="pricingModel" label="Pricing Model">
              <Input placeholder="e.g., Per Case, Monthly, Annual" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="slaTier" label="SLA Tier">
          <Select placeholder="Select SLA tier">
            <Option value="Basic">Basic</Option>
            <Option value="Standard">Standard</Option>
            <Option value="Premium">Premium</Option>
            <Option value="Enterprise">Enterprise</Option>
          </Select>
        </Form.Item>
      </div>

      <div className="form-section">
        <div className="form-section-title">Admin (Optional)</div>
        <Form.Item
          name="tags"
          label="Tags"
          tooltip="Enter tags separated by commas"
        >
          <Select
            mode="tags"
            placeholder="Enter tags"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </div>
    </Form>
  );
};

export default CaseProviderForm;
