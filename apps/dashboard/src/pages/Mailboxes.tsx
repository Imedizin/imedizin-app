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
  MailOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import MailboxForm from "@/components/forms/MailboxForm";
import { primaryColor } from "@/theme/constants";
import {
  useGetMailboxesQuery,
  useAddMailboxCommand,
  useUpdateMailboxCommand,
  useDeleteMailboxCommand,
} from "@/services/mailboxes";
import type { Mailbox } from "@/types/mailbox";

export interface MailboxFormData {
  address: string;
  name: string;
}

const { Title, Text } = Typography;

const Mailboxes: React.FC = () => {
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMailbox, setEditingMailbox] = useState<Mailbox | null>(null);

  // Fetch mailboxes
  const { data: mailboxes = [], isLoading, error } = useGetMailboxesQuery();

  // Commands
  const { addMutation } = useAddMailboxCommand();
  const { updateMutation } = useUpdateMailboxCommand();
  const { deleteMutation } = useDeleteMailboxCommand();

  const columns: ColumnsType<Mailbox> = [
    {
      title: "Email Address",
      dataIndex: "address",
      key: "address",
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

  const handleEdit = (mailbox: Mailbox) => {
    setEditingMailbox(mailbox);
    form.setFieldsValue({
      address: mailbox.address,
      name: mailbox.name,
    });
    setDrawerOpen(true);
  };

  const handleDelete = (mailbox: Mailbox) => {
    Modal.confirm({
      title: "Delete Mailbox",
      content: `Are you sure you want to delete "${mailbox.name}" (${mailbox.address})?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        deleteMutation.mutate(mailbox.id);
      },
    });
  };

  const handleSubmit = (values: MailboxFormData) => {
    if (editingMailbox) {
      updateMutation
        .mutateAsync({
          id: editingMailbox.id,
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
    setEditingMailbox(null);
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
                  <MailOutlined style={{ marginRight: 4 }} />
                  Mailboxes
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
              Mailboxes
            </Title>
            <Text type="secondary">
              Manage email mailboxes and their settings
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingMailbox(null);
              form.resetFields();
              setDrawerOpen(true);
            }}
            style={{ backgroundColor: primaryColor }}
          >
            Add Mailbox
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
              Error loading mailboxes: {(error as Error).message}
            </Text>
          </div>
        )}
        <Table
          columns={columns}
          dataSource={mailboxes}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      <Drawer
        title={editingMailbox ? "Edit Mailbox" : "Add Mailbox"}
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
              {editingMailbox ? "Update" : "Create"}
            </Button>
          </Space>
        }
      >
        <MailboxForm
          form={form}
          initialValues={editingMailbox || undefined}
          onSubmit={handleSubmit}
        />
      </Drawer>
    </>
  );
};

export default Mailboxes;
