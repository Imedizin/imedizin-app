import React, { useEffect } from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Button,
  Space,
  Form,
  Spin,
} from "antd";
import {
  HomeOutlined,
  MedicineBoxOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import MedicalProviderForm from "@/components/forms/MedicalProviderForm";
import { primaryColor } from "@/theme/constants";
import type {
  MedicalProvider,
  CreateMedicalProviderDto,
} from "@/types/medical-provider";
import {
  useGetMedicalProviderQuery,
  useCreateMedicalProviderCommand,
  useUpdateMedicalProviderCommand,
} from "@/services/medical-providers";

const { Title, Text } = Typography;

const MedicalProviderFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = Boolean(id);

  const { data: provider, isLoading: loadingProvider, error } =
    useGetMedicalProviderQuery(isEdit ? id! : "");
  const { createMutation } = useCreateMedicalProviderCommand();
  const { updateMutation } = useUpdateMedicalProviderCommand();

  const loading = isEdit ? loadingProvider : false;
  const submitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isEdit) {
      form.resetFields();
      form.setFieldsValue({ status: "active" });
    }
  }, [isEdit, form]);

  const handleSubmit = (values: CreateMedicalProviderDto) => {
    if (isEdit && id) {
      updateMutation.mutate(
        { id, ...values },
        {
          onSuccess: () => {
            navigate(`/medical-providers/${id}`);
          },
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: (data) => {
          navigate(`/medical-providers/${data.id}`);
        },
      });
    }
  };

  const handleCancel = () => {
    if (isEdit && id) {
      navigate(`/medical-providers/${id}`);
    } else {
      navigate("/medical-providers");
    }
  };

  if (isEdit && !id) {
    return (
      <Card>
        <Text type="danger">Invalid route.</Text>
        <div style={{ marginTop: 16 }}>
          <Button type="link" onClick={() => navigate("/medical-providers")}>
            Back to list
          </Button>
        </div>
      </Card>
    );
  }

  if (isEdit && (loading || error || !provider)) {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading medical provider…</Text>
          </div>
        </div>
      );
    }
    return (
      <Card>
        <Text type="danger">
          {error
            ? `Error: ${(error as Error).message}`
            : "Medical provider not found."}
        </Text>
        <div style={{ marginTop: 16 }}>
          <Button type="link" onClick={() => navigate("/medical-providers")}>
            Back to list
          </Button>
        </div>
      </Card>
    );
  }

  const p = provider as MedicalProvider | undefined;
  const pageTitle = isEdit ? "Edit Medical Provider" : "Add Medical Provider";
  const breadcrumbName = isEdit ? p?.legalName : "New";

  return (
    <div className="form-page-container">
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/" },
            {
              title: (
                <Link to="/medical-providers">
                  <MedicineBoxOutlined style={{ marginRight: 4 }} />
                  Medical Providers
                </Link>
              ),
            },
            { title: breadcrumbName },
          ]}
          style={{ marginBottom: 8 }}
        />
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleCancel}
          style={{ marginBottom: 12, paddingLeft: 0 }}
        >
          {isEdit ? "Back to provider" : "Back to list"}
        </Button>
        <Title level={3} style={{ margin: "0 0 4px 0" }}>
          {pageTitle}
        </Title>
        <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
          {isEdit
            ? "Update the medical provider details below."
            : "Enter the mandatory identity, contact and status details. Optional fields can be filled later."}
        </Text>
      </div>

      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <MedicalProviderForm
          form={form}
          initialValues={p}
          onSubmit={handleSubmit}
        />
        <div className="form-actions-bar">
          <Space size="middle">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={submitting}
              style={{ backgroundColor: primaryColor }}
            >
              {isEdit ? "Save changes" : "Create"}
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default MedicalProviderFormPage;
