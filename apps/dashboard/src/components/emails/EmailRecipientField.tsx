import React from "react";
import { Input, Tag, Typography } from "antd";

const { Text } = Typography;

export interface RecipientItem {
  email: string;
  name?: string;
}

export interface EmailRecipientFieldProps {
  /** Label shown before the field (e.g. "To", "Cc", "Bcc") */
  label: string;
  /** Placeholder when no recipients; fallback when there are recipients */
  placeholder?: string;
  /** Current raw input value (controlled) */
  value: string;
  /** Called when the user types in the input */
  onChange: (value: string) => void;
  /** List of added recipients (tags) */
  recipients: RecipientItem[];
  /** Called when recipients change (add/remove) */
  onRecipientsChange: (recipients: RecipientItem[]) => void;
  /** Optional border color for the row (e.g. for dark mode) */
  borderColor?: string;
}

function parseEmailInput(input: string): RecipientItem | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { email: match[2].trim(), name: match[1].trim() };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) {
    return { email: trimmed };
  }

  return null;
}

function processRecipientInput(
  value: string,
  currentRecipients: RecipientItem[],
  onRecipientsChange: (recipients: RecipientItem[]) => void,
): string {
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const newRecipients: RecipientItem[] = [];

  parts.forEach((part) => {
    const parsed = parseEmailInput(part);
    if (parsed) {
      newRecipients.push(parsed);
    }
  });

  if (newRecipients.length > 0) {
    onRecipientsChange([...currentRecipients, ...newRecipients]);
    return "";
  }

  return value;
}

export const EmailRecipientField: React.FC<EmailRecipientFieldProps> = ({
  label,
  placeholder = "",
  value,
  onChange,
  recipients,
  onRecipientsChange,
  borderColor = "#e8e8e8",
}) => {
  const handleAddFromInput = (currentValue: string) => {
    const remaining = processRecipientInput(
      currentValue,
      recipients,
      onRecipientsChange,
    );
    onChange(remaining);
  };

  const removeRecipient = (index: number) => {
    onRecipientsChange(recipients.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddFromInput(value);
    } else if (e.key === "Escape") {
      onChange("");
    }
  };

  const handleBlur = () => {
    if (value.trim()) {
      handleAddFromInput(value);
    }
  };

  return (
    <div
      style={{
        padding: "8px 12px",
        borderBottom: `1px solid ${borderColor}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <Text
        style={{
          color: "#8c8c8c",
          fontSize: 12,
          width: 40,
          flexShrink: 0,
          paddingTop: 4,
        }}
      >
        {label}
      </Text>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        {recipients.map((recipient, index) => (
          <Tag
            key={`${recipient.email}-${index}`}
            closable
            onClose={() => removeRecipient(index)}
            style={{ margin: 0 }}
          >
            {recipient.name
              ? `${recipient.name} <${recipient.email}>`
              : recipient.email}
          </Tag>
        ))}
        <Input
          placeholder={recipients.length === 0 ? placeholder : ""}
          bordered={false}
          style={{
            flex: 1,
            minWidth: 100,
            padding: 0,
            background: "transparent",
          }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </div>
    </div>
  );
};
