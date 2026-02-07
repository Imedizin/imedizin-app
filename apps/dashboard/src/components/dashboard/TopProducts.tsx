import React from 'react';
import { Card, List } from 'antd';
import {
  InboxOutlined,
  SolutionOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  GlobalOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

// BIA Theme Colors
const primaryColor = '#0d7377'; // Teal
const accentColor = '#b5892e'; // Gold

interface Shortcut {
  key: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  color: string;
}

const shortcuts: Shortcut[] = [
  {
    key: 'mails',
    title: 'Mails',
    path: '/mails',
    icon: <InboxOutlined />,
    color: primaryColor,
  },
  {
    key: 'assistance',
    title: 'Assistance Requests',
    path: '/assistance-requests',
    icon: <SolutionOutlined />,
    color: '#10a37f',
  },
  {
    key: 'case-providers',
    title: 'Case Providers',
    path: '/case-providers',
    icon: <TeamOutlined />,
    color: accentColor,
  },
  {
    key: 'medical-providers',
    title: 'Medical Providers',
    path: '/medical-providers',
    icon: <MedicineBoxOutlined />,
    color: '#6366f1',
  },
  {
    key: 'domains',
    title: 'Domains',
    path: '/domains',
    icon: <GlobalOutlined />,
    color: '#ec4899',
  },
  {
    key: 'mailboxes',
    title: 'Mailboxes',
    path: '/mailboxes',
    icon: <MailOutlined />,
    color: '#0ea5e9',
  },
];

const TopProducts: React.FC = () => {
  return (
    <Card
      title="Quick Access"
      bordered={false}
      style={{
        borderRadius: 12,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        height: '100%',
      }}
    >
      <List
        itemLayout="horizontal"
        dataSource={shortcuts}
        renderItem={(item) => (
          <List.Item style={{ padding: '10px 0', border: 'none' }}>
            <Link
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: item.color,
                }}
              >
                {item.icon}
              </div>
              <span style={{ fontWeight: 500 }}>{item.title}</span>
            </Link>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default TopProducts;
