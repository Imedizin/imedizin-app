import React, { useState } from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Modal,
  message,
} from "antd";
import {
  HomeOutlined,
  GlobalOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import DomainForm from "@/components/forms/DomainForm";
import { primaryColor } from "@/theme/constants";
import {
  useGetDomainsQuery,
  useAddDomainCommand,
  useUpdateDomainCommand,
  useDeleteDomainCommand,
} from "@/services/domains";
import type { Domain } from "@/types/domain";

export interface DomainFormData {
  domain: string;
  name: string;
}

const { Title, Text } = Typography;

const Domains: React.FC = () => {
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);

  // Fetch domains
  const { data: domains = [], isLoading, error } = useGetDomainsQuery();

  // Commands
  const { addMutation } = useAddDomainCommand();
  const { updateMutation } = useUpdateDomainCommand();
  const { deleteMutation } = useDeleteDomainCommand();

  const columns: ColumnsType<Domain> = [
    {
      title: "Domain Name",
      dataIndex: "domain",
      key: "domain",
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Display Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
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
            onClick={() => handleDelete(record)}
            size="small"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    form.setFieldsValue({
      domain: domain.domain,
      name: domain.name,
    });
    setDrawerOpen(true);
  };

  const handleDelete = (domain: Domain) => {
    Modal.confirm({
      title: "Delete Domain",
      content: `Are you sure you want to delete "${domain.name}" (${domain.domain})?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        deleteMutation.mutate(domain.id);
      },
    });
  };

  const handleSubmit = (values: DomainFormData) => {
    if (editingDomain) {
      updateMutation
        .mutateAsync({
          id: editingDomain.id,
          data: values,
        })
        .then(() => {
          handleClose();
        });
    } else {
      addMutation.mutateAsync(values).then(() => {
        handleClose();
      });
    }
  };

  const handleClose = () => {
    form.resetFields();
    setDrawerOpen(false);
    setEditingDomain(null);
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
                  <GlobalOutlined style={{ marginRight: 4 }} />
                  Domains
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
              Domains
            </Title>
            <Text type="secondary">
              Manage email domains and their settings
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingDomain(null);
              form.resetFields();
              setDrawerOpen(true);
            }}
            style={{ backgroundColor: primaryColor }}
          >
            Add Domain
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
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#fff2f0",
              borderRadius: 4,
            }}
          >
            <Text type="danger">
              Error loading domains: {(error as Error).message}
            </Text>
          </div>
        )}
        <Table
          columns={columns}
          dataSource={domains}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      <Drawer
        title={editingDomain ? "Edit Domain" : "Add Domain"}
        width={720}
        onClose={handleClose}
        open={drawerOpen}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={addMutation.isPending || updateMutation.isPending}
              style={{ backgroundColor: primaryColor }}
            >
              {editingDomain ? "Update" : "Create"}
            </Button>
          </Space>
        }
      >
        <DomainForm
          form={form}
          initialValues={editingDomain || undefined}
          onSubmit={handleSubmit}
        />
      </Drawer>
    </>
  );
};

export default Domains;
