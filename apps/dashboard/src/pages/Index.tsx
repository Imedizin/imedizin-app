import React from "react";
import { Row, Col, Typography, Breadcrumb } from "antd";
import { HomeOutlined, DashboardOutlined } from "@ant-design/icons";
import StatCards from "@/components/dashboard/StatCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentOrders from "@/components/dashboard/RecentOrders";
import TopProducts from "@/components/dashboard/TopProducts";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

const { Title, Text } = Typography;

const Index: React.FC = () => {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: <HomeOutlined />, href: "/" },
            {
              title: (
                <>
                  <DashboardOutlined style={{ marginRight: 4 }} />
                  Dashboard
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
              Dashboard
            </Title>
            <Text type="secondary">
              Overview of your cases, mails, and assistance requests.
            </Text>
          </div>
        </div>
      </div>

      <StatCards />

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} xl={16}>
          <RevenueChart />
        </Col>
        <Col xs={24} xl={8}>
          <TopProducts />
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} xl={16}>
          <RecentOrders />
        </Col>
        <Col xs={24} xl={8}>
          <ActivityFeed />
        </Col>
      </Row>
    </>
  );
};

export default Index;
