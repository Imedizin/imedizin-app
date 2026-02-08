import React from "react";
import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  MailOutlined,
  GlobalOutlined,
  InboxOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  ApartmentOutlined,
  SolutionOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  path?: string,
): MenuItem {
  const menuLabel = path ? (
    <Link to={path} style={{ textDecoration: "none", color: "inherit" }}>
      {label}
    </Link>
  ) : (
    label
  );

  return {
    key,
    icon,
    children,
    label: menuLabel,
  } as MenuItem;
}

const menuItems: MenuItem[] = [
  getItem("Dashboard", "/", <DashboardOutlined />, undefined, "/"),
  getItem("Mails", "/mails", <InboxOutlined />, undefined, "/mails"),
  getItem(
    "Assistance Requests",
    "assistance-requests",
    <SolutionOutlined />,
    [
      getItem(
        "Medical cases",
        "/assistance-requests/medical-cases",
        <MedicineBoxOutlined />,
        undefined,
        "/assistance-requests/medical-cases",
      ),
      getItem(
        "Transportation",
        "/assistance-requests/transportation",
        <CarOutlined />,
        undefined,
        "/assistance-requests/transportation",
      ),
    ],
    "/assistance-requests",
  ),
  getItem("Our Network", "our-network", <ApartmentOutlined />, [
    getItem(
      "Case Providers (Insurers)",
      "/case-providers",
      <TeamOutlined />,
      undefined,
      "/case-providers",
    ),
    getItem(
      "Medical Providers",
      "/medical-providers",
      <MedicineBoxOutlined />,
      undefined,
      "/medical-providers",
    ),
  ]),
  getItem("Mailbox Management", "mailbox-management", <MailOutlined />, [
    getItem("Domains", "/domains", <GlobalOutlined />, undefined, "/domains"),
    getItem(
      "Mailboxes",
      "/mailboxes",
      <MailOutlined />,
      undefined,
      "/mailboxes",
    ),
  ]),
];

function getSelectedKey(pathname: string): string {
  if (pathname === "/") {
    return "/";
  }

  const menuPaths: string[] = [];
  const extractPaths = (items: MenuItem[]) => {
    items.forEach((item) => {
      if (item?.key && typeof item.key === "string") {
        if (item.key.startsWith("/")) {
          menuPaths.push(item.key);
        }
      }
      if (item && "children" in item && Array.isArray(item.children)) {
        extractPaths(item.children);
      }
    });
  };
  extractPaths(menuItems);

  const matchingPath = menuPaths
    .filter((path) => {
      if (pathname === path) return true;
      if (pathname.startsWith(path)) {
        const nextChar = pathname[path.length];
        return nextChar === "/" || nextChar === undefined;
      }
      return false;
    })
    .sort((a, b) => b.length - a.length)[0];

  return matchingPath || pathname;
}

interface DashboardSidebarProps {
  collapsed: boolean;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ collapsed }) => {
  const { isDark } = useTheme();
  const { pathname } = useLocation();
  const selectedKey = getSelectedKey(pathname);

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      theme={isDark ? "dark" : "light"}
      width={256}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        borderRight: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
        background: isDark ? "#141414" : "#fff",
      }}
    >
      <div
        style={{
          minHeight: collapsed ? 43 : 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: collapsed ? "12px 8px 8px" : "16px 20px 12px",
          marginTop: collapsed ? 6 : 12,
          marginBottom: 0,
        }}
      >
        <span
          className="imedizin-wordmark"
          style={{
            fontSize: collapsed ? 26 : 38,
            transition: "font-size 0.2s ease",
          }}
          aria-label="iMedizin"
        >
          iMedizin
        </span>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={[
          "our-network",
          "mailbox-management",
          "assistance-requests",
        ]}
        style={{ border: "none", padding: "4px 0 8px" }}
        items={menuItems}
      />
    </Sider>
  );
};

export default DashboardSidebar;
