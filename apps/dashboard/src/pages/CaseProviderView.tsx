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
  TeamOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useGetCaseProviderQuery } from "@/services/case-providers";
import { primaryColor } from "@/theme/constants";
import type { CaseProvider } from "@/types/case-provider";

const { Title, Text } = Typography;

const providerTypeColors: Record<string, string> = {
  internal: "blue",
  external: "green",
  TPA: "purple",
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

const CaseProviderView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: provider, isLoading, error } = useGetCaseProviderQuery(id ?? "");

  if (!id) {
    return (
      <Card>
        <Text type="danger">Invalid provider: no ID provided.</Text>
        <div style={{ marginTop: 16 }}>
          <Button type="link" onClick={() => navigate("/case-providers")}>
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
          <Text type="secondary">Loading case provider…</Text>
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
            : "Case provider not found."}
        </Text>
        <div style={{ marginTop: 16 }}>
          <Button type="link" onClick={() => navigate("/case-providers")}>
            Back to list
          </Button>
        </div>
      </Card>
    );
  }

  const p = provider as CaseProvider;

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/" },
            {
              title: (
                <Link to="/case-providers">
                  <TeamOutlined style={{ marginRight: 4 }} />
                  Case Providers
                </Link>
              ),
            },
            { title: p.companyName },
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
              onClick={() => navigate("/case-providers")}
              style={{ marginBottom: 8, paddingLeft: 0 }}
            >
              Back to list
            </Button>
            <Title level={3} style={{ margin: "0 0 4px 0" }}>
              {p.companyName}
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
            onClick={() => navigate(`/case-providers/${id}/edit`)}
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
            <Descriptions.Item label="Company name">
              <Text strong>{p.companyName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={providerTypeColors[p.providerType] ?? "default"}>
                {p.providerType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[p.status]}>{p.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {formatDate(p.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Last updated">
              {formatDate(p.updatedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Operating regions" span={2}>
              {p.operatingRegions?.length ? (
                <Space wrap>
                  {p.operatingRegions.map((r) => (
                    <Tag key={r}>{r}</Tag>
                  ))}
                </Space>
              ) : (
                "—"
              )}
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
              <CalendarOutlined />
              Commercial
            </Space>
          }
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
          }}
        >
          <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered size="middle">
            <Descriptions.Item label="Contract start">
              <Space>
                <CalendarOutlined />
                {formatDate(p.contractStartDate ?? undefined)}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Contract end">
              <Space>
                <CalendarOutlined />
                {formatDate(p.contractEndDate ?? undefined)}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Pricing model">
              {p.pricingModel ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="SLA tier">
              {p.slaTier ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Tags" span={2}>
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
          </Descriptions>
        </Card>
      </Space>
    </>
  );
};

export default CaseProviderView;
