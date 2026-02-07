import React from 'react';
import { Card, Table, Tag, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import { MedicineBoxOutlined, CarOutlined } from '@ant-design/icons';

// BIA Theme Colors
const primaryColor = '#0d7377'; // Teal
const accentColor = '#b5892e'; // Gold

interface AssistanceRequestRow {
  key: string;
  ref: string;
  type: 'medical' | 'transport';
  subject: string;
  status: 'open' | 'in_progress' | 'pending' | 'closed';
  date: string;
}

const data: AssistanceRequestRow[] = [
  {
    key: '1',
    ref: 'AR-2024-0842',
    type: 'medical',
    subject: 'Follow-up documentation request',
    status: 'in_progress',
    date: '2024-02-05',
  },
  {
    key: '2',
    ref: 'AR-2024-0841',
    type: 'transport',
    subject: 'Patient transfer – Clinic to hospital',
    status: 'pending',
    date: '2024-02-05',
  },
  {
    key: '3',
    ref: 'AR-2024-0840',
    type: 'medical',
    subject: 'Medical report clarification',
    status: 'open',
    date: '2024-02-04',
  },
  {
    key: '4',
    ref: 'AR-2024-0839',
    type: 'transport',
    subject: 'Ambulance booking confirmation',
    status: 'closed',
    date: '2024-02-04',
  },
  {
    key: '5',
    ref: 'AR-2024-0838',
    type: 'medical',
    subject: 'Lab results review',
    status: 'in_progress',
    date: '2024-02-03',
  },
];

const statusColors: Record<string, string> = {
  open: 'blue',
  in_progress: 'orange',
  pending: 'gold',
  closed: 'green',
};

const columns: ColumnsType<AssistanceRequestRow> = [
  {
    title: 'Reference',
    dataIndex: 'ref',
    key: 'ref',
    render: (text, record) => (
      <Link
        to={
          record.type === 'transport'
            ? '/assistance-requests/transportation'
            : '/assistance-requests/medical-cases'
        }
        style={{ fontWeight: 500, color: primaryColor }}
      >
        {text}
      </Link>
    ),
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (type) =>
      type === 'medical' ? (
        <Tag icon={<MedicineBoxOutlined />} color="blue">
          Medical
        </Tag>
      ) : (
        <Tag icon={<CarOutlined />} color="green">
          Transport
        </Tag>
      ),
  },
  {
    title: 'Subject',
    dataIndex: 'subject',
    key: 'subject',
    ellipsis: true,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag color={statusColors[status]} style={{ textTransform: 'capitalize', borderRadius: 4 }}>
        {status.replace('_', ' ')}
      </Tag>
    ),
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    render: (date) =>
      new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
  },
];

const RecentOrders: React.FC = () => {
  return (
    <Card
      title="Recent Assistance Requests"
      bordered={false}
      style={{ borderRadius: 12, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}
      extra={
        <Link to="/assistance-requests">
          <Button type="link">View All</Button>
        </Link>
      }
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
