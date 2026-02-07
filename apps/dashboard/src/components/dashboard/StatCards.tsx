import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MedicineBoxOutlined,
  CarOutlined,
  MailOutlined,
  TeamOutlined,
} from '@ant-design/icons';

// BIA Theme Colors
const primaryColor = '#0d7377'; // Teal
const accentColor = '#b5892e'; // Gold

const stats = [
  {
    title: 'Active Cases',
    value: 24,
    trend: 12.5,
    trendUp: true,
    icon: <MedicineBoxOutlined />,
    color: primaryColor,
  },
  {
    title: 'Pending Transport',
    value: 8,
    trend: 5.2,
    trendUp: false,
    icon: <CarOutlined />,
    color: '#10a37f',
  },
  {
    title: 'Unread Mails',
    value: 12,
    trend: 3.1,
    trendUp: false,
    icon: <MailOutlined />,
    color: accentColor,
  },
  {
    title: 'Medical Providers',
    value: 15,
    trend: 8.0,
    trendUp: true,
    icon: <TeamOutlined />,
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
