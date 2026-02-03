import React from 'react';
import { Card, List, Avatar, Progress, Tag } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';

// BIA Theme Colors
const primaryColor = '#0d7377'; // Teal
const accentColor = '#b5892e'; // Gold

interface Product {
  id: string;
  name: string;
  category: string;
  sales: number;
  maxSales: number;
  revenue: number;
  trend: 'up' | 'down';
  color: string;
}

const products: Product[] = [
  {
    id: '1',
    name: 'MacBook Pro 14"',
    category: 'Electronics',
    sales: 1240,
    maxSales: 1500,
    revenue: 3099600,
    trend: 'up',
    color: primaryColor,
  },
  {
    id: '2',
    name: 'iPhone 15 Pro Max',
    category: 'Mobile',
    sales: 980,
    maxSales: 1500,
    revenue: 1175020,
    trend: 'up',
    color: '#10a37f',
  },
  {
    id: '3',
    name: 'AirPods Pro 2',
    category: 'Audio',
    sales: 856,
    maxSales: 1500,
    revenue: 213144,
    trend: 'down',
    color: accentColor,
  },
  {
    id: '4',
    name: 'iPad Air',
    category: 'Tablets',
    sales: 720,
    maxSales: 1500,
    revenue: 575280,
    trend: 'up',
    color: '#6366f1',
  },
  {
    id: '5',
    name: 'Apple Watch Ultra',
    category: 'Wearables',
    sales: 640,
    maxSales: 1500,
    revenue: 511360,
    trend: 'down',
    color: '#ec4899',
  },
];

const TopProducts: React.FC = () => {
  return (
    <Card
      title="Top Products"
      bordered={false}
      style={{ borderRadius: 12, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)', height: '100%' }}
    >
      <List
        itemLayout="horizontal"
        dataSource={products}
        renderItem={(item) => (
          <List.Item style={{ padding: '12px 0', border: 'none' }}>
            <List.Item.Meta
              avatar={
                <Avatar
                  style={{ backgroundColor: `${item.color}15` }}
                  icon={<ShoppingOutlined style={{ color: item.color }} />}
                  size={44}
                />
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                  <span style={{ fontWeight: 600, color: '#262626' }}>
                    ${(item.revenue / 1000).toFixed(0)}k
                  </span>
                </div>
              }
              description={
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Tag color="default" style={{ margin: 0 }}>{item.category}</Tag>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>{item.sales} sales</span>
                  </div>
                  <Progress
                    percent={(item.sales / item.maxSales) * 100}
                    showInfo={false}
                    strokeColor={item.color}
                    trailColor="#f5f5f5"
                    size="small"
                  />
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default TopProducts;
