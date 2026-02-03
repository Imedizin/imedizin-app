import React from "react";
import { Form, Input } from "antd";

export interface DomainFormData {
  domain: string;
  name: string;
}

interface DomainFormProps {
  form: any;
  initialValues?: DomainFormData;
  onSubmit: (values: DomainFormData) => void;
}

const DomainForm: React.FC<DomainFormProps> = ({
  form,
  initialValues,
  onSubmit,
}) => {
  const handleFinish = (values: DomainFormData) => {
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={initialValues}
    >
      <Form.Item
        name="domain"
        label="Domain Name"
        rules={[
          { required: true, message: "Please enter domain name" },
          {
            pattern:
              /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
            message: "Please enter a valid domain name (e.g., example.com)",
          },
        ]}
      >
        <Input placeholder="e.g., ourdomain.com" />
      </Form.Item>

      <Form.Item
        name="name"
        label="Display Name"
        rules={[{ required: true, message: "Please enter display name" }]}
      >
        <Input placeholder="e.g., Our Company Domain" />
      </Form.Item>
    </Form>
  );
};

export default DomainForm;
