import React, { useState } from "react";
import { Layout } from "antd";
import { useTheme } from "@/hooks/useTheme";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { RealtimeSocketProvider } from "@/components/realtime/RealtimeSocketProvider";

const { Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isDark } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <DashboardSidebar collapsed={collapsed} />
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 256,
          transition: "all 0.2s",
          background: isDark ? "#000" : "#f5f5f5",
        }}
      >
        <DashboardHeader
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(!collapsed)}
        />
        <Content
          style={{
            margin: 24,
            minHeight: 280,
          }}
        >
          <RealtimeSocketProvider />
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
