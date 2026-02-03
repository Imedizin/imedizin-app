import React, { useState } from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Table,
  Tag,
  Button,
  Space,
  Drawer,
  Form,
} from "antd";
import {
  HomeOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import MedicalProviderForm from "@/components/forms/MedicalProviderForm";
import { primaryColor } from "@/theme/constants";

const { Title, Text } = Typography;

interface MedicalProvider {
  id: string;
  legal_name: string;
  provider_type: "hospital" | "clinic" | "lab" | "pharmacy" | "doctor";
  country: string;
  primary_email: string;
  primary_phone: string;
  status: "active" | "inactive";
  specialties?: string[];
  services?: string[];
  business_hours?: string;
  accepted_insurers?: string[];
  in_network?: "true" | "false" | "unknown";
  pre_authorization_required?: "true" | "false" | "unknown";
  license_number?: string;
  internal_notes?: string;
  tags?: string[];
  onboarded_at?: string;
  created_at: string;
  updated_at: string;
}

const MedicalProviders: React.FC = () => {
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<MedicalProvider | null>(null);

  // Mock data - replace with API call
  const [providers, setProviders] = useState<MedicalProvider[]>([
    {
      id: "1",
      legal_name: "City General Hospital",
      provider_type: "hospital",
      country: "USA",
      primary_email: "contact@citygeneral.com",
      primary_phone: "+1-555-0101",
      status: "active",
      specialties: ["Cardiology", "Emergency Medicine"],
      services: ["Emergency Care", "Surgery"],
      accepted_insurers: ["Blue Cross", "Aetna"],
      in_network: "true",
      created_at: "2024-01-15",
      updated_at: "2024-01-20",
    },
  ]);

  const providerTypeColors: Record<string, string> = {
    hospital: "blue",
    clinic: "green",
    lab: "purple",
    pharmacy: "orange",
    doctor: "cyan",
  };

  const statusColors: Record<string, string> = {
    active: "green",
    inactive: "red",
  };

  const columns: ColumnsType<MedicalProvider> = [
    {
      title: "Legal Name",
      dataIndex: "legal_name",
      key: "legal_name",
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Type",
      dataIndex: "provider_type",
      key: "provider_type",
      render: (type) => (
        <Tag
          color={providerTypeColors[type]}
          style={{ textTransform: "capitalize" }}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
    },
    {
      title: "Email",
      dataIndex: "primary_email",
      key: "primary_email",
    },
    {
      title: "Phone",
      dataIndex: "primary_phone",
      key: "primary_phone",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={statusColors[status]}
          style={{ textTransform: "capitalize" }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (provider: MedicalProvider) => {
    setEditingProvider(provider);
    form.setFieldsValue(provider);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    setProviders(providers.filter((p) => p.id !== id));
  };

  const handleSubmit = (values: any) => {
    const providerData = {
      ...values,
      id: editingProvider?.id || Date.now().toString(),
      created_at:
        editingProvider?.created_at || new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString().split("T")[0],
    };

    if (editingProvider) {
      setProviders(
        providers.map((p) => (p.id === editingProvider.id ? providerData : p)),
      );
    } else {
      setProviders([...providers, providerData]);
    }

    form.resetFields();
    setDrawerOpen(false);
    setEditingProvider(null);
  };

  const handleClose = () => {
    form.resetFields();
    setDrawerOpen(false);
    setEditingProvider(null);
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/" },
            {
              title: (
                <>
                  <MedicineBoxOutlined style={{ marginRight: 4 }} />
                  Medical Providers
                </>
              ),
            },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Medical Providers
            </Title>
            <Text type="secondary">
              Manage medical providers and their information
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProvider(null);
              form.resetFields();
              setDrawerOpen(true);
            }}
            style={{ backgroundColor: primaryColor }}
          >
            Add Provider
          </Button>
        </div>
      </div>

      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        }}
      >
        <Table
          columns={columns}
          dataSource={providers}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      <Drawer
        title={
          editingProvider ? "Edit Medical Provider" : "Add Medical Provider"
        }
        width={720}
        onClose={handleClose}
        open={drawerOpen}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingProvider ? "Update" : "Create"}
            </Button>
          </Space>
        }
      >
        <MedicalProviderForm
          form={form}
          initialValues={editingProvider || undefined}
          onSubmit={handleSubmit}
        />
      </Drawer>
    </>
  );
};

export default MedicalProviders;
