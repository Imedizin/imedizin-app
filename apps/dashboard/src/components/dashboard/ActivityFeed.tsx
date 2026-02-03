import React from 'react';
import { Card, Timeline, Avatar, Typography } from 'antd';
import {
  ShoppingCartOutlined,
  UserAddOutlined,
  MessageOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// BIA Theme Colors
const primaryColor = '#0d7377'; // Teal
const accentColor = '#b5892e'; // Gold

interface Activity {
  id: string;
  type: 'order' | 'user' | 'message' | 'payment' | 'complete';
  title: string;
  description: string;
  time: string;
  color: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'order',
    title: 'New order received',
    description: 'Sarah Johnson placed an order for MacBook Pro',
    time: '2 min ago',
    color: primaryColor,
  },
  {
    id: '2',
    type: 'user',
    title: 'New user registered',
    description: 'Michael Chen created a new account',
    time: '15 min ago',
    color: '#10a37f',
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment received',
    description: 'Payment of $2,499 received from Emily Davis',
    time: '1 hour ago',
    color: accentColor,
  },
  {
    id: '4',
    type: 'complete',
    title: 'Order completed',
    description: 'Order #ORD-098 has been delivered',
    time: '2 hours ago',
    color: '#6366f1',
  },
  {
    id: '5',
    type: 'message',
    title: 'New support ticket',
    description: 'James Wilson opened a support ticket',
    time: '3 hours ago',
    color: '#ec4899',
  },
];

const iconMap = {
  order: <ShoppingCartOutlined />,
  user: <UserAddOutlined />,
  message: <MessageOutlined />,
  payment: <DollarOutlined />,
  complete: <CheckCircleOutlined />,
};

const ActivityFeed: React.FC = () => {
  return (
    <Card
      title="Recent Activity"
      bordered={false}
      style={{ borderRadius: 12, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)', height: '100%' }}
    >
      <Timeline
        items={activities.map((activity) => ({
          dot: (
            <Avatar
              size={32}
              style={{ backgroundColor: `${activity.color}15` }}
              icon={React.cloneElement(iconMap[activity.type], { style: { color: activity.color } })}
            />
          ),
          children: (
            <div style={{ paddingTop: 4 }}>
              <div style={{ fontWeight: 500, marginBottom: 2 }}>{activity.title}</div>
              <Text type="secondary" style={{ fontSize: 13 }}>{activity.description}</Text>
              <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 4 }}>{activity.time}</div>
            </div>
          ),
        }))}
      />
    </Card>
  );
};

export default ActivityFeed;
