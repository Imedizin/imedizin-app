import React from 'react';
import { Card, Timeline, Avatar, Typography } from 'antd';
import {
  SolutionOutlined,
  MailOutlined,
  CarOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

// BIA Theme Colors
const primaryColor = '#0d7377'; // Teal
const accentColor = '#b5892e'; // Gold

interface Activity {
  id: string;
  type: 'case' | 'mail' | 'transport' | 'medical' | 'complete';
  title: string;
  description: string;
  time: string;
  color: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'case',
    title: 'New assistance request',
    description: 'AR-2024-0842 – Follow-up documentation request',
    time: '2 min ago',
    color: primaryColor,
  },
  {
    id: '2',
    type: 'mail',
    title: 'New mail in thread',
    description: 'Re: Lab results – Dr. Müller',
    time: '15 min ago',
    color: '#10a37f',
  },
  {
    id: '3',
    type: 'transport',
    title: 'Transport request updated',
    description: 'AR-2024-0841 – Pickup time confirmed',
    time: '1 hour ago',
    color: accentColor,
  },
  {
    id: '4',
    type: 'complete',
    title: 'Case closed',
    description: 'AR-2024-0839 – Ambulance booking completed',
    time: '2 hours ago',
    color: '#6366f1',
  },
  {
    id: '5',
    type: 'medical',
    title: 'Medical report received',
    description: 'AR-2024-0838 – Lab results attached',
    time: '3 hours ago',
    color: '#ec4899',
  },
];

const iconMap = {
  case: <SolutionOutlined />,
  mail: <MailOutlined />,
  transport: <CarOutlined />,
  medical: <MedicineBoxOutlined />,
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
