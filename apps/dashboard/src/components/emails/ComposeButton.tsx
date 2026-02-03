import React from "react";
import { Button } from "antd";
import { EditOutlined } from "@ant-design/icons";

export interface ComposeButtonProps {
  onClick: () => void;
  primaryColor?: string;
  /** When true, no bottom margin and smaller height (e.g. for header) */
  compact?: boolean;
}

const defaultPrimaryColor = "#0d7377";

const ComposeButton: React.FC<ComposeButtonProps> = ({
  onClick,
  primaryColor = defaultPrimaryColor,
  compact = false,
}) => {
  return (
    <Button
      type="primary"
      icon={<EditOutlined />}
      block={!compact}
      onClick={onClick}
      style={{
        backgroundColor: primaryColor,
        height: compact ? 36 : 44,
        marginBottom: compact ? 0 : 16,
        borderRadius: 8,
        fontWeight: 500,
      }}
    >
      Compose
    </Button>
  );
};

export default ComposeButton;
