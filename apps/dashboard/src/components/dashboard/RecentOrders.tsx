import React from 'react';
import { Card, Table, Tag, Avatar, Space, Button, Dropdown } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

// BIA Theme Colors
const primaryColor = '#0d7377'; // Teal
const accentColor = '#b5892e'; // Gold

interface OrderType {
  key: string;
  orderId: string;
  customer: {
    name: string;
    email: string;
    avatar: string;
  };
  product: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing' | 'cancelled';
  date: string;
}

const data: OrderType[] = [
  {
    key: '1',
    orderId: '#ORD-001',
    customer: {
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      avatar: 'S',
    },
    product: 'MacBook Pro 14"',
    amount: 2499,
    status: 'completed',
    date: '2024-01-15',
  },
  {
    key: '2',
    orderId: '#ORD-002',
    customer: {
      name: 'Michael Chen',
      email: 'michael.c@email.com',
      avatar: 'M',
    },
    product: 'iPhone 15 Pro Max',
    amount: 1199,
    status: 'processing',
    date: '2024-01-14',
  },
  {
    key: '3',
    orderId: '#ORD-003',
    customer: {
      name: 'Emily Davis',
      email: 'emily.d@email.com',
      avatar: 'E',
    },
    product: 'AirPods Pro 2',
    amount: 249,
    status: 'pending',
    date: '2024-01-13',
  },
  {
    key: '4',
    orderId: '#ORD-004',
    customer: {
      name: 'James Wilson',
      email: 'james.w@email.com',
      avatar: 'J',
    },
    product: 'iPad Air',
    amount: 799,
    status: 'completed',
    date: '2024-01-12',
  },
  {
    key: '5',
    orderId: '#ORD-005',
    customer: {
      name: 'Lisa Anderson',
      email: 'lisa.a@email.com',
      avatar: 'L',
    },
    product: 'Apple Watch Ultra',
    amount: 799,
    status: 'cancelled',
    date: '2024-01-11',
  },
];

const statusColors: Record<string, string> = {
  completed: 'green',
  pending: 'orange',
  processing: 'blue',
  cancelled: 'red',
};

const avatarColors = [primaryColor, '#10a37f', accentColor, '#6366f1', '#ec4899'];

const actionItems: MenuProps['items'] = [
  { key: 'view', label: 'View Details', icon: <EyeOutlined /> },
  { key: 'edit', label: 'Edit Order', icon: <EditOutlined /> },
  { type: 'divider' },
  { key: 'delete', label: 'Delete', icon: <DeleteOutlined />, danger: true },
];

const columns: ColumnsType<OrderType> = [
  {
    title: 'Order ID',
    dataIndex: 'orderId',
    key: 'orderId',
    render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
  },
  {
    title: 'Customer',
    dataIndex: 'customer',
    key: 'customer',
    render: (customer, _, index) => (
      <Space>
        <Avatar style={{ backgroundColor: avatarColors[index % avatarColors.length] }}>
          {customer.avatar}
        </Avatar>
        <div>
          <div style={{ fontWeight: 500 }}>{customer.name}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{customer.email}</div>
        </div>
      </Space>
    ),
  },
  {
    title: 'Product',
    dataIndex: 'product',
    key: 'product',
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    render: (amount) => <span style={{ fontWeight: 500 }}>${amount.toLocaleString()}</span>,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag color={statusColors[status]} style={{ textTransform: 'capitalize', borderRadius: 4 }}>
        {status}
      </Tag>
    ),
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    render: (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  },
  {
    title: '',
    key: 'action',
    width: 50,
    render: () => (
      <Dropdown menu={{ items: actionItems }} trigger={['click']} placement="bottomRight">
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
    ),
  },
];

const RecentOrders: React.FC = () => {
  return (
    <Card
      title="Recent Orders"
      bordered={false}
      style={{ borderRadius: 12, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}
      extra={<Button type="link">View All</Button>}
    >
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="middle"
        style={{ marginTop: -8 }}
      />
    </Card>
  );
};

export default RecentOrders;
