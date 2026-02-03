import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  EyeOutlined,
} from '@ant-design/icons';

// BIA Theme Colors
const primaryColor = '#0d7377'; // Teal
const accentColor = '#b5892e'; // Gold

const stats = [
  {
    title: 'Total Revenue',
    value: 126560,
    prefix: '$',
    trend: 12.5,
    trendUp: true,
    icon: <DollarOutlined />,
    color: primaryColor,
  },
  {
    title: 'Total Orders',
    value: 8846,
    trend: 8.2,
    trendUp: true,
    icon: <ShoppingCartOutlined />,
    color: '#10a37f',
  },
  {
    title: 'Total Customers',
    value: 5423,
    trend: 3.1,
    trendUp: false,
    icon: <UserOutlined />,
    color: accentColor,
  },
  {
    title: 'Page Views',
    value: 234500,
    trend: 15.3,
    trendUp: true,
    icon: <EyeOutlined />,
    color: '#6366f1',
  },
];

const StatCards: React.FC = () => {
  return (
    <Row gutter={[24, 24]}>
      {stats.map((stat, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 14, marginBottom: 8 }}>
                  {stat.title}
                </div>
                <Statistic
                  value={stat.value}
                  prefix={stat.prefix}
                  valueStyle={{ fontSize: 28, fontWeight: 600 }}
                />
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 14,
                  }}
                >
                  {stat.trendUp ? (
                    <ArrowUpOutlined style={{ color: '#10a37f' }} />
                  ) : (
                    <ArrowDownOutlined style={{ color: '#ef4444' }} />
                  )}
                  <span style={{ color: stat.trendUp ? '#10a37f' : '#ef4444' }}>
                    {stat.trend}%
                  </span>
                  <span style={{ color: '#8c8c8c' }}>vs last month</span>
                </div>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  color: stat.color,
                }}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default StatCards;
