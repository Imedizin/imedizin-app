import React from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Descriptions,
  Tag,
  Button,
  Spin,
  Space,
} from "antd";
import {
  HomeOutlined,
  MedicineBoxOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useGetMedicalProviderQuery } from "@/services/medical-providers";
import { primaryColor } from "@/theme/constants";
import type { MedicalProvider } from "@/types/medical-provider";

const { Title, Text } = Typography;

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

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const MedicalProviderView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: provider, isLoading, error } = useGetMedicalProviderQuery(
    id ?? "",
  );

  if (!id) {
    return (
      <Card>
        <Text type="danger">Invalid provider: no ID provided.</Text>
        <div style={{ marginTop: 16 }}>
          <Button type="link" onClick={() => navigate("/medical-providers")}>
            Back to list
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading medical provider…</Text>
        </div>
      </div>
    );
  }

  if (error || !provider) {
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

  const p = provider as MedicalProvider;

  return (
    <>
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
            { title: p.legalName },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/medical-providers")}
              style={{ marginBottom: 8, paddingLeft: 0 }}
            >
              Back to list
            </Button>
            <Title level={3} style={{ margin: "0 0 4px 0" }}>
              {p.legalName}
            </Title>
            <Space align="center">
              <Tag color={providerTypeColors[p.providerType] ?? "default"}>
                {p.providerType}
              </Tag>
              <Tag color={statusColors[p.status] ?? "default"}>{p.status}</Tag>
            </Space>
          </div>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/medical-providers/${id}/edit`)}
            style={{ backgroundColor: primaryColor }}
          >
            Edit
          </Button>
        </div>
      </div>

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card
          title="Overview"
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
        >
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered size="middle">
            <Descriptions.Item label="Legal name">
              <Text strong>{p.legalName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={providerTypeColors[p.providerType] ?? "default"}>
                {p.providerType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Country">{p.country}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[p.status]}>{p.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {formatDate(p.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Last updated">
              {formatDate(p.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title={
            <Space>
              <MailOutlined />
              Contact
            </Space>
          }
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
        >
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="Primary email">
              <Space>
                <MailOutlined />
                <a href={`mailto:${p.primaryEmail}`}>{p.primaryEmail}</a>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Primary phone">
              <Space>
                <PhoneOutlined />
                {p.primaryPhone}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title={
            <Space>
              <MedicineBoxOutlined />
              Operational
            </Space>
          }
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
        >
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="Specialties">
              {p.specialties?.length ? (
                <Space wrap>
                  {p.specialties.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </Space>
              ) : (
                "—"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Services">
              {p.services?.length ? (
                <Space wrap>
                  {p.services.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </Space>
              ) : (
                "—"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Business hours">
              {p.businessHours ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="License number">
              {p.licenseNumber ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Tags">
              {p.tags?.length ? (
                <Space wrap>
                  {p.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </Space>
              ) : (
                "—"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Onboarded at">
              <Space>
                <CalendarOutlined />
                {formatDate(p.onboardedAt ?? undefined)}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>
    </>
  );
};

export default MedicalProviderView;
