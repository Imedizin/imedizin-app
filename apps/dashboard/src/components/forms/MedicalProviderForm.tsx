import React, { useEffect } from "react";
import { Form, Input, Select, DatePicker, Typography } from "antd";
import type { FormInstance } from "antd/es/form";
import dayjs from "dayjs";
import { MEDICAL_SPECIALTY_GROUPS } from "@/constants/medical-specialties";
import type {
  MedicalProvider,
  CreateMedicalProviderDto,
} from "@/types/medical-provider";

const { Title } = Typography;
const { Option, OptGroup } = Select;

interface MedicalProviderFormProps {
  form: FormInstance;
  initialValues?: Partial<MedicalProvider>;
  onSubmit: (values: CreateMedicalProviderDto) => void;
}

const MedicalProviderForm: React.FC<MedicalProviderFormProps> = ({
  form,
  initialValues,
  onSubmit,
}) => {
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        onboardedAt: initialValues.onboardedAt
          ? dayjs(initialValues.onboardedAt)
          : undefined,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: "active" });
    }
  }, [initialValues, form]);

  const handleFinish = (values: CreateMedicalProviderDto & { onboardedAt?: dayjs.Dayjs }) => {
    const payload: CreateMedicalProviderDto = {
      legalName: values.legalName,
      providerType: values.providerType,
      country: values.country,
      primaryEmail: values.primaryEmail,
      primaryPhone: values.primaryPhone,
      status: values.status,
      specialties: values.specialties ?? [],
      services: values.services ?? [],
      businessHours: values.businessHours ?? null,
      licenseNumber: values.licenseNumber ?? null,
      tags: values.tags ?? [],
      onboardedAt: values.onboardedAt
        ? values.onboardedAt.format("YYYY-MM-DD")
        : null,
    };
    onSubmit(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        status: "active",
        ...initialValues,
        onboardedAt: initialValues?.onboardedAt
          ? dayjs(initialValues.onboardedAt)
          : undefined,
      }}
    >
      <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
        Identity (Mandatory)
      </Title>
      <Form.Item
        name="legalName"
        label="Legal Name"
        rules={[{ required: true, message: "Please enter legal name" }]}
      >
        <Input placeholder="Enter legal name" />
      </Form.Item>

      <Form.Item
        name="providerType"
        label="Provider Type"
        rules={[{ required: true, message: "Please select provider type" }]}
      >
        <Select placeholder="Select provider type">
          <Option value="hospital">Hospital</Option>
          <Option value="clinic">Clinic</Option>
          <Option value="lab">Lab</Option>
          <Option value="pharmacy">Pharmacy</Option>
          <Option value="doctor">Doctor</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="country"
        label="Country"
        rules={[{ required: true, message: "Please enter country" }]}
      >
        <Input placeholder="Enter country" />
      </Form.Item>

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
        Contact (Mandatory)
      </Title>
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

      <Form.Item
        name="primaryPhone"
        label="Primary Phone"
        rules={[{ required: true, message: "Please enter phone number" }]}
      >
        <Input placeholder="Enter phone number" />
      </Form.Item>

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
        Status & Audit (Mandatory)
      </Title>
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

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
        Operational (Optional)
      </Title>
      <Form.Item
        name="specialties"
        label="Specialties"
        tooltip="Select one or more specialties"
      >
        <Select
          mode="multiple"
          placeholder="Select specialties"
          style={{ width: "100%" }}
          allowClear
          showSearch
          optionFilterProp="label"
        >
          {MEDICAL_SPECIALTY_GROUPS.map((group) => (
            <OptGroup key={group.label} label={group.label}>
              {group.options.map((value) => (
                <Option
                  key={`${group.label}-${value}`}
                  value={value}
                  label={value}
                >
                  {value}
                </Option>
              ))}
            </OptGroup>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="services"
        label="Services"
        tooltip="Enter services separated by commas"
      >
        <Select
          mode="tags"
          placeholder="Enter services"
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item name="businessHours" label="Business Hours">
        <Input placeholder="e.g., Mon-Fri 9AM-5PM" />
      </Form.Item>

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
        Admin (Optional)
      </Title>
      <Form.Item name="licenseNumber" label="License Number">
        <Input placeholder="Enter license number" />
      </Form.Item>

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

      <Form.Item name="onboardedAt" label="Onboarded At">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
    </Form>
  );
};

export default MedicalProviderForm;
