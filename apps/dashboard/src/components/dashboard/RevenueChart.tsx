import React from 'react';
import { Card, Segmented } from 'antd';
import { Area } from '@ant-design/charts';

// BIA Theme Colors
const primaryColor = '#0d7377'; // Teal
const accentColor = '#b5892e'; // Gold

const data = [
  { month: 'Jan', value: 18, category: 'Cases Opened' },
  { month: 'Feb', value: 22, category: 'Cases Opened' },
  { month: 'Mar', value: 19, category: 'Cases Opened' },
  { month: 'Apr', value: 28, category: 'Cases Opened' },
  { month: 'May', value: 25, category: 'Cases Opened' },
  { month: 'Jun', value: 31, category: 'Cases Opened' },
  { month: 'Jul', value: 27, category: 'Cases Opened' },
  { month: 'Aug', value: 35, category: 'Cases Opened' },
  { month: 'Sep', value: 32, category: 'Cases Opened' },
  { month: 'Oct', value: 38, category: 'Cases Opened' },
  { month: 'Nov', value: 34, category: 'Cases Opened' },
  { month: 'Dec', value: 42, category: 'Cases Opened' },
  { month: 'Jan', value: 145, category: 'Mails Received' },
  { month: 'Feb', value: 168, category: 'Mails Received' },
  { month: 'Mar', value: 152, category: 'Mails Received' },
  { month: 'Apr', value: 198, category: 'Mails Received' },
  { month: 'May', value: 182, category: 'Mails Received' },
  { month: 'Jun', value: 215, category: 'Mails Received' },
  { month: 'Jul', value: 203, category: 'Mails Received' },
  { month: 'Aug', value: 241, category: 'Mails Received' },
  { month: 'Sep', value: 228, category: 'Mails Received' },
  { month: 'Oct', value: 267, category: 'Mails Received' },
  { month: 'Nov', value: 252, category: 'Mails Received' },
  { month: 'Dec', value: 289, category: 'Mails Received' },
];

const RevenueChart: React.FC = () => {
  const config = {
    data,
    xField: 'month',
    yField: 'value',
    seriesField: 'category',
    smooth: true,
    animation: {
      appear: {
        animation: 'wave-in',
        duration: 1500,
      },
    },
    color: [primaryColor, accentColor],
    areaStyle: (datum: { category: string }) => {
      return {
        fill: datum.category === 'Cases Opened'
          ? `l(270) 0:#ffffff 0.5:${primaryColor}40 1:${primaryColor}`
          : `l(270) 0:#ffffff 0.5:${accentColor}40 1:${accentColor}`,
      };
    },
    yAxis: {
      label: {
        formatter: (v: string) => v,
      },
      grid: {
        line: {
          style: {
            stroke: '#f0f0f0',
            lineDash: [4, 4],
          },
        },
      },
    },
    xAxis: {
      line: null,
      tickLine: null,
    },
    legend: {
      position: 'top-right' as const,
    },
    tooltip: {
      formatter: (datum: { category: string; value: number }) => {
        return { name: datum.category, value: datum.value.toLocaleString() };
      },
    },
  };

  return (
    <Card
      title="Activity Overview"
      bordered={false}
      style={{ borderRadius: 12, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}
      extra={
        <Segmented
          options={['Weekly', 'Monthly', 'Yearly']}
          defaultValue="Monthly"
        />
      }
    >
      <Area {...config} height={350} />
    </Card>
  );
};

export default RevenueChart;
