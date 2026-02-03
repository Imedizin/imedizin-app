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
  Rate,
} from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import CaseProviderForm from "@/components/forms/CaseProviderForm";
import { primaryColor } from "@/theme/constants";

const { Title, Text } = Typography;

interface CaseProvider {
  id: string;
  company_name: string;
  provider_type: "internal" | "external" | "TPA";
  operating_regions: string[];
  primary_email: string;
  primary_phone: string;
  status: "active" | "inactive";
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
  created_at: string;
  updated_at: string;
}

const CaseProviders: React.FC = () => {
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<CaseProvider | null>(
    null,
  );

  // Mock data - replace with API call
  const [providers, setProviders] = useState<CaseProvider[]>([
    {
      id: "1",
      company_name: "Global Case Management Inc.",
      provider_type: "external",
      operating_regions: ["North America", "Europe"],
      primary_email: "contact@globalcase.com",
      primary_phone: "+1-555-0202",
      status: "active",
      supported_insurers: ["Blue Cross", "UnitedHealth"],
      supported_policy_types: ["Health", "Dental"],
      supported_languages: ["English", "Spanish"],
      case_types: ["Medical", "Dental"],
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      pricing_model: "Per Case",
      sla_tier: "Premium",
      performance_rating: 4.5,
      created_at: "2024-01-10",
      updated_at: "2024-01-15",
    },
  ]);

  const providerTypeColors: Record<string, string> = {
    internal: "blue",
    external: "green",
    TPA: "purple",
  };

  const statusColors: Record<string, string> = {
    active: "green",
    inactive: "red",
  };

  const columns: ColumnsType<CaseProvider> = [
    {
      title: "Company Name",
      dataIndex: "company_name",
      key: "company_name",
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Type",
      dataIndex: "provider_type",
      key: "provider_type",
      render: (type) => (
        <Tag
          color={providerTypeColors[type]}
          style={{ textTransform: "uppercase" }}
        >
          {type}
        </Tag>
      ),
    },
    {
      title: "Operating Regions",
      dataIndex: "operating_regions",
      key: "operating_regions",
      render: (regions) => (
        <Space wrap>
          {regions?.map((region: string) => (
            <Tag key={region}>{region}</Tag>
          ))}
        </Space>
      ),
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
      title: "Rating",
      dataIndex: "performance_rating",
      key: "performance_rating",
      render: (rating) =>
        rating ? (
          <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} />
        ) : (
          "-"
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

  const handleEdit = (provider: CaseProvider) => {
    setEditingProvider(provider);
    // Don't set form values here - let the form component handle it via initialValues
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
                  <TeamOutlined style={{ marginRight: 4 }} />
                  Case Providers
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
              Case Providers
            </Title>
            <Text type="secondary">
              Manage case providers and their capabilities
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
        title={editingProvider ? "Edit Case Provider" : "Add Case Provider"}
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
        <CaseProviderForm
          form={form}
          initialValues={editingProvider || undefined}
          onSubmit={handleSubmit}
        />
      </Drawer>
    </>
  );
};

export default CaseProviders;
