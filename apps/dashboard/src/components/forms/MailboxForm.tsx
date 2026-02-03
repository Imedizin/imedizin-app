import React from "react";
import { Form, Input } from "antd";

export interface MailboxFormData {
  address: string;
  name: string;
}

interface MailboxFormProps {
  form: any;
  initialValues?: MailboxFormData;
  onSubmit: (values: MailboxFormData) => void;
}

const MailboxForm: React.FC<MailboxFormProps> = ({
  form,
  initialValues,
  onSubmit,
}) => {
  const handleFinish = (values: MailboxFormData) => {
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
        name="address"
        label="Email Address"
        rules={[
          { required: true, message: "Please enter email address" },
          { type: "email", message: "Please enter a valid email address" },
        ]}
      >
        <Input placeholder="e.g., support@ourdomain.com" />
      </Form.Item>

      <Form.Item
        name="name"
        label="Display Name"
        rules={[{ required: true, message: "Please enter display name" }]}
      >
        <Input placeholder="e.g., Support, HR, Sales" />
      </Form.Item>
    </Form>
  );
};

export default MailboxForm;
