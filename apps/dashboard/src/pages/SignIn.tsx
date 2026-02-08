import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Typography, Alert } from "antd";
import { useTheme } from "@/hooks/useTheme";

const DEMO_EMAIL = "admin@imedizin.com";
const DEMO_PASSWORD = "12345";

const SignIn = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [form] = Form.useForm();
  const [error, setError] = useState("");

  const handleSubmit = (values: { email: string; password: string }) => {
    setError("");
    if (values.email?.trim() !== DEMO_EMAIL || values.password !== DEMO_PASSWORD) {
      setError("Invalid email or password");
      return;
    }
    sessionStorage.setItem("fake-signed-in", "true");
    sessionStorage.setItem("fake-user-email", values.email);
    navigate("/", { replace: true });
  };

  return (
    <div
      className={isDark ? "dark" : undefined}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: isDark
          ? "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f0f23 100%)"
          : "linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 50%, #cbd5e1 100%)",
      }}
    >
      <span
        className="imedizin-wordmark"
        style={{
          fontSize: 42,
          marginBottom: 32,
          display: "block",
        }}
        aria-label="iMedizin"
      >
        iMedizin
      </span>
      <Card
        style={{ width: "100%", maxWidth: 400 }}
        styles={{
          body: { padding: "24px 24px 16px" },
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Sign in
          </Typography.Title>
          <Typography.Text type="secondary">
            Enter your credentials to access the dashboard.
          </Typography.Text>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={() => setError("")}
        >
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              role="alert"
            />
          )}
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please enter your email" }]}
          >
            <Input
              type="email"
              placeholder="admin@imedizin.com"
              autoComplete="email"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              placeholder="••••••••"
              autoComplete="current-password"
              size="large"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block size="large">
              Sign in
            </Button>
          </Form.Item>
        </Form>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", textAlign: "center" }}>
          Demo: admin@imedizin.com / 12345
        </Typography.Text>
      </Card>
    </div>
  );
};

export default SignIn;
