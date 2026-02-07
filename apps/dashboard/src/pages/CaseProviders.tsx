import React, { useState, useEffect } from "react";
import {
  Typography,
  Breadcrumb,
  Card,
  Table,
  Tag,
  Button,
  Space,
  Spin,
  Input,
  Select,
  Row,
  Col,
} from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import type { ColumnsType } from "antd/es/table";
import { useQueryStates, parseAsString } from "nuqs";
import { primaryColor } from "@/theme/constants";
import type {
  CaseProvider,
  CaseProviderListParams,
} from "@/types/case-provider";
import { OPERATING_REGIONS } from "@/constants/operating-regions";
import { useListCaseProvidersQuery } from "@/services/case-providers";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

const { Title, Text } = Typography;

const PROVIDER_TYPES = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
  { value: "TPA", label: "TPA" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const caseProviderParsers = {
  search: parseAsString,
  providerType: parseAsString,
  operatingRegion: parseAsString,
  status: parseAsString,
};

const CaseProviders: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useQueryStates(caseProviderParsers);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  const [debouncedSetSearch, cancelSearch] = useDebouncedCallback(
    (value: string | null) => setFilters({ search: value || null }),
    300,
  );

  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  const listParams: CaseProviderListParams = {
    search: filters.search ?? undefined,
    providerType: filters.providerType ?? undefined,
    operatingRegion: filters.operatingRegion ?? undefined,
    status: filters.status ?? undefined,
  };

  const { data: providers = [], isLoading } =
    useListCaseProvidersQuery(listParams);

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
      dataIndex: "companyName",
      key: "companyName",
      render: (text, record) => (
        <Link to={`/case-providers/${record.id}`} style={{ fontWeight: 500 }}>
          {text}
        </Link>
      ),
    },
    {
      title: "Type",
      dataIndex: "providerType",
      key: "providerType",
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
      dataIndex: "operatingRegions",
      key: "operatingRegions",
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
      dataIndex: "primaryEmail",
      key: "primaryEmail",
    },
    {
      title: "Phone",
      dataIndex: "primaryPhone",
      key: "primaryPhone",
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
      width: 140,
      render: (_, record) => (
        <Space>
          <Link to={`/case-providers/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">
              View
            </Button>
          </Link>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (provider: CaseProvider) => {
    navigate(`/case-providers/${provider.id}/edit`);
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
            onClick={() => navigate("/case-providers/new")}
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
        <Space
          direction="vertical"
          size="middle"
          style={{ width: "100%", marginBottom: 16 }}
        >
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Search company, email, phone..."
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                value={searchInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchInput(v);
                  debouncedSetSearch(v || null);
                }}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Type"
                allowClear
                style={{ width: "100%" }}
                value={filters.providerType ?? undefined}
                onChange={(value) =>
                  setFilters({ providerType: value ?? null })
                }
                options={PROVIDER_TYPES}
              />
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Select
                placeholder="Operating region"
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                value={filters.operatingRegion ?? undefined}
                onChange={(value) =>
                  setFilters({ operatingRegion: value ?? null })
                }
                options={OPERATING_REGIONS.map((r) => ({ value: r, label: r }))}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Status"
                allowClear
                style={{ width: "100%" }}
                value={filters.status ?? undefined}
                onChange={(value) => setFilters({ status: value ?? null })}
                options={STATUS_OPTIONS}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Button
                icon={<ClearOutlined />}
                onClick={() => {
                  cancelSearch();
                  setFilters(null);
                }}
                style={{ width: "100%" }}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Space>
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={providers}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </Spin>
      </Card>
    </>
  );
};

export default CaseProviders;
