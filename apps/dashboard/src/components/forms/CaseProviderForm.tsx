import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, Rate, Typography } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CaseProviderFormData {
  company_name: string;
  provider_type: 'internal' | 'external' | 'TPA';
  operating_regions: string[];
  primary_email: string;
  primary_phone: string;
  status: 'active' | 'inactive';
  supported_insurers?: string[];
  supported_policy_types?: string[];
  supported_languages?: string[];
  case_types?: string[];
  contract_start_date?: string;
  contract_end_date?: string;
  pricing_model?: string;
  sla_tier?: string;
  performance_rating?: number;
  internal_notes?: string;
  tags?: string[];
}

interface CaseProviderFormProps {
  form: any;
  initialValues?: CaseProviderFormData;
  onSubmit: (values: any) => void;
}

const CaseProviderForm: React.FC<CaseProviderFormProps> = ({ form, initialValues, onSubmit }) => {
  const handleFinish = (values: any) => {
    const formData = {
      ...values,
      contract_start_date: values.contract_start_date ? values.contract_start_date.format('YYYY-MM-DD') : undefined,
      contract_end_date: values.contract_end_date ? values.contract_end_date.format('YYYY-MM-DD') : undefined,
    };
    onSubmit(formData);
  };

  // Update form values when initialValues change (for editing)
  useEffect(() => {
    if (initialValues) {
      const processedValues = {
        ...initialValues,
        contract_start_date: initialValues.contract_start_date ? dayjs(initialValues.contract_start_date) : undefined,
        contract_end_date: initialValues.contract_end_date ? dayjs(initialValues.contract_end_date) : undefined,
      };
      form.setFieldsValue(processedValues);
    } else {
      // Reset form when no initial values (for new entry)
      form.resetFields();
      form.setFieldsValue({ status: 'active' });
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        status: 'active',
      }}
    >
      <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>Identity (Mandatory)</Title>
      <Form.Item
        name="company_name"
        label="Company Name"
        rules={[{ required: true, message: 'Please enter company name' }]}
      >
        <Input placeholder="Enter company name" />
      </Form.Item>

      <Form.Item
        name="provider_type"
        label="Provider Type"
        rules={[{ required: true, message: 'Please select provider type' }]}
      >
        <Select placeholder="Select provider type">
          <Option value="internal">Internal</Option>
          <Option value="external">External</Option>
          <Option value="TPA">TPA</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="operating_regions"
        label="Operating Regions"
        rules={[{ required: true, message: 'Please enter at least one operating region' }]}
        tooltip="Enter regions separated by commas"
      >
        <Select
          mode="tags"
          placeholder="Enter operating regions"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Contact (Mandatory)</Title>
      <Form.Item
        name="primary_email"
        label="Primary Email"
        rules={[
          { required: true, message: 'Please enter email' },
          { type: 'email', message: 'Please enter a valid email' },
        ]}
      >
        <Input placeholder="Enter email address" />
      </Form.Item>

      <Form.Item
        name="primary_phone"
        label="Primary Phone"
        rules={[{ required: true, message: 'Please enter phone number' }]}
      >
        <Input placeholder="Enter phone number" />
      </Form.Item>

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Status & Audit (Mandatory)</Title>
      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: 'Please select status' }]}
      >
        <Select placeholder="Select status">
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
      </Form.Item>

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Capabilities (Optional)</Title>
      <Form.Item
        name="supported_insurers"
        label="Supported Insurers"
        tooltip="Enter insurer names separated by commas"
      >
        <Select
          mode="tags"
          placeholder="Enter supported insurers"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="supported_policy_types"
        label="Supported Policy Types"
        tooltip="Enter policy types separated by commas"
      >
        <Select
          mode="tags"
          placeholder="Enter policy types"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="supported_languages"
        label="Supported Languages"
        tooltip="Enter languages separated by commas"
      >
        <Select
          mode="tags"
          placeholder="Enter supported languages"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="case_types"
        label="Case Types"
        tooltip="Enter case types separated by commas"
      >
        <Select
          mode="tags"
          placeholder="Enter case types"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Commercial (Optional)</Title>
      <Form.Item
        name="contract_start_date"
        label="Contract Start Date"
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="contract_end_date"
        label="Contract End Date"
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="pricing_model"
        label="Pricing Model"
      >
        <Input placeholder="e.g., Per Case, Monthly, Annual" />
      </Form.Item>

      <Form.Item
        name="sla_tier"
        label="SLA Tier"
      >
        <Select placeholder="Select SLA tier">
          <Option value="Basic">Basic</Option>
          <Option value="Standard">Standard</Option>
          <Option value="Premium">Premium</Option>
          <Option value="Enterprise">Enterprise</Option>
        </Select>
      </Form.Item>

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Admin / Performance (Optional)</Title>
      <Form.Item
        name="performance_rating"
        label="Performance Rating"
        tooltip="Rate from 1 to 5"
      >
        <Rate />
      </Form.Item>

      <Form.Item
        name="internal_notes"
        label="Internal Notes"
      >
        <TextArea rows={4} placeholder="Enter internal notes" />
      </Form.Item>

      <Form.Item
        name="tags"
        label="Tags"
        tooltip="Enter tags separated by commas"
      >
        <Select
          mode="tags"
          placeholder="Enter tags"
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  );
};

export default CaseProviderForm;
