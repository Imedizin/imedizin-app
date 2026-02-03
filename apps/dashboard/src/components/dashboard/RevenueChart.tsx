import React from 'react';
import { Card, Segmented } from 'antd';
import { Area } from '@ant-design/charts';

// BIA Theme Colors
const primaryColor = '#0d7377'; // Teal
const accentColor = '#b5892e'; // Gold

const data = [
  { month: 'Jan', value: 3200, category: 'Revenue' },
  { month: 'Feb', value: 4100, category: 'Revenue' },
  { month: 'Mar', value: 3800, category: 'Revenue' },
  { month: 'Apr', value: 5200, category: 'Revenue' },
  { month: 'May', value: 4800, category: 'Revenue' },
  { month: 'Jun', value: 6100, category: 'Revenue' },
  { month: 'Jul', value: 5600, category: 'Revenue' },
  { month: 'Aug', value: 7200, category: 'Revenue' },
  { month: 'Sep', value: 6800, category: 'Revenue' },
  { month: 'Oct', value: 8100, category: 'Revenue' },
  { month: 'Nov', value: 7500, category: 'Revenue' },
  { month: 'Dec', value: 9200, category: 'Revenue' },
  { month: 'Jan', value: 2100, category: 'Expenses' },
  { month: 'Feb', value: 2400, category: 'Expenses' },
  { month: 'Mar', value: 2200, category: 'Expenses' },
  { month: 'Apr', value: 2800, category: 'Expenses' },
  { month: 'May', value: 2600, category: 'Expenses' },
  { month: 'Jun', value: 3100, category: 'Expenses' },
  { month: 'Jul', value: 2900, category: 'Expenses' },
  { month: 'Aug', value: 3500, category: 'Expenses' },
  { month: 'Sep', value: 3200, category: 'Expenses' },
  { month: 'Oct', value: 3800, category: 'Expenses' },
  { month: 'Nov', value: 3500, category: 'Expenses' },
  { month: 'Dec', value: 4200, category: 'Expenses' },
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
        fill: datum.category === 'Revenue' 
          ? `l(270) 0:#ffffff 0.5:${primaryColor}40 1:${primaryColor}` 
          : `l(270) 0:#ffffff 0.5:${accentColor}40 1:${accentColor}`,
      };
    },
    yAxis: {
      label: {
        formatter: (v: string) => `$${Number(v) / 1000}k`,
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
        return { name: datum.category, value: `$${datum.value.toLocaleString()}` };
      },
    },
  };

  return (
    <Card
      title="Revenue Overview"
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
