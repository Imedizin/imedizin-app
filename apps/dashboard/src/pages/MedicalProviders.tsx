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
  MedicineBoxOutlined,
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
  MedicalProvider,
  MedicalProviderListParams,
} from "@/types/medical-provider";
import { ALL_MEDICAL_SPECIALTIES } from "@/constants/medical-specialties";
import { useListMedicalProvidersQuery } from "@/services/medical-providers";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

const { Title, Text } = Typography;

const PROVIDER_TYPES = [
  { value: "hospital", label: "Hospital" },
  { value: "clinic", label: "Clinic" },
  { value: "lab", label: "Lab" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "doctor", label: "Doctor" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const medicalProviderParsers = {
  search: parseAsString,
  providerType: parseAsString,
  country: parseAsString,
  status: parseAsString,
  specialty: parseAsString,
};

const MedicalProviders: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useQueryStates(medicalProviderParsers);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  const [debouncedSetSearch, cancelSearch] = useDebouncedCallback(
    (value: string | null) => setFilters({ search: value || null }),
    300,
  );

  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  const listParams: MedicalProviderListParams = {
    search: filters.search ?? undefined,
    providerType: filters.providerType ?? undefined,
    country: filters.country ?? undefined,
    status: filters.status ?? undefined,
    specialty: filters.specialty ?? undefined,
  };

  const { data: providers = [], isLoading } =
    useListMedicalProvidersQuery(listParams);

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
      dataIndex: "legalName",
      key: "legalName",
      render: (text, record) => (
        <Link to={`/medical-providers/${record.id}`} style={{ fontWeight: 500 }}>
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
          <Link to={`/medical-providers/${record.id}`}>
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

  const handleEdit = (provider: MedicalProvider) => {
    navigate(`/medical-providers/${provider.id}/edit`);
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
            onClick={() => navigate("/medical-providers/new")}
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
                placeholder="Search name, email, phone, country..."
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
            <Col xs={24} sm={12} md={4}>
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
            <Col xs={24} sm={12} md={4}>
              <Input
                placeholder="Country"
                value={filters.country ?? ""}
                onChange={(e) =>
                  setFilters({ country: e.target.value || null })
                }
                allowClear
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
              <Select
                placeholder="Specialty"
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                value={filters.specialty ?? undefined}
                onChange={(value) =>
                  setFilters({ specialty: value ?? null })
                }
                options={ALL_MEDICAL_SPECIALTIES.map((s) => ({
                  value: s,
                  label: s,
                }))}
              />
            </Col>
            <Col xs={24} sm={12} md={2}>
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

export default MedicalProviders;
