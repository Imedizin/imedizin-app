import React from 'react';
import { Form, Input, Select, DatePicker, Typography } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface MedicalProviderFormData {
  legal_name: string;
  provider_type: 'hospital' | 'clinic' | 'lab' | 'pharmacy' | 'doctor';
  country: string;
  primary_email: string;
  primary_phone: string;
  status: 'active' | 'inactive';
  specialties?: string[];
  services?: string[];
  business_hours?: string;
  accepted_insurers?: string[];
  in_network?: 'true' | 'false' | 'unknown';
  pre_authorization_required?: 'true' | 'false' | 'unknown';
  license_number?: string;
  internal_notes?: string;
  tags?: string[];
  onboarded_at?: string;
}

interface MedicalProviderFormProps {
  form: any;
  initialValues?: MedicalProviderFormData;
  onSubmit: (values: any) => void;
}

const MedicalProviderForm: React.FC<MedicalProviderFormProps> = ({ form, initialValues, onSubmit }) => {
  const handleFinish = (values: any) => {
    const formData = {
      ...values,
      onboarded_at: values.onboarded_at ? values.onboarded_at.format('YYYY-MM-DD') : undefined,
    };
    onSubmit(formData);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        status: 'active',
        in_network: 'unknown',
        pre_authorization_required: 'unknown',
        ...initialValues,
        onboarded_at: initialValues?.onboarded_at ? dayjs(initialValues.onboarded_at) : undefined,
      }}
    >
      <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>Identity (Mandatory)</Title>
      <Form.Item
        name="legal_name"
        label="Legal Name"
        rules={[{ required: true, message: 'Please enter legal name' }]}
      >
        <Input placeholder="Enter legal name" />
      </Form.Item>

      <Form.Item
        name="provider_type"
        label="Provider Type"
        rules={[{ required: true, message: 'Please select provider type' }]}
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
        rules={[{ required: true, message: 'Please enter country' }]}
      >
        <Input placeholder="Enter country" />
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

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Operational (Optional)</Title>
      <Form.Item
        name="specialties"
        label="Specialties"
        tooltip="Enter specialties separated by commas"
      >
        <Select
          mode="tags"
          placeholder="Enter specialties"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="services"
        label="Services"
        tooltip="Enter services separated by commas"
      >
        <Select
          mode="tags"
          placeholder="Enter services"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="business_hours"
        label="Business Hours"
      >
        <Input placeholder="e.g., Mon-Fri 9AM-5PM" />
      </Form.Item>

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Insurance Metadata (Optional)</Title>
      <Form.Item
        name="accepted_insurers"
        label="Accepted Insurers"
        tooltip="Enter insurer names separated by commas"
      >
        <Select
          mode="tags"
          placeholder="Enter insurer names"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="in_network"
        label="In Network"
      >
        <Select placeholder="Select status">
          <Option value="true">True</Option>
          <Option value="false">False</Option>
          <Option value="unknown">Unknown</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="pre_authorization_required"
        label="Pre-Authorization Required"
      >
        <Select placeholder="Select status">
          <Option value="true">True</Option>
          <Option value="false">False</Option>
          <Option value="unknown">Unknown</Option>
        </Select>
      </Form.Item>

      <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>Admin / Internal (Optional)</Title>
      <Form.Item
        name="license_number"
        label="License Number"
      >
        <Input placeholder="Enter license number" />
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

      <Form.Item
        name="onboarded_at"
        label="Onboarded At"
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  );
};

export default MedicalProviderForm;
