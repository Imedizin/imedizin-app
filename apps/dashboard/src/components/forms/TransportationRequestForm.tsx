import React, { useState } from "react";
import {
  Form,
  Input,
  Select,
  FormInstance,
  Button,
  Space,
  Input as AntInput,
  message,
  Typography,
  Tag,
} from "antd";
import { PlusOutlined, MessageOutlined, UserOutlined } from "@ant-design/icons";
import type { TransportationRequestFormData } from "@/types/transportation-request";
import { useGetThreadsQuery } from "@/services/emails/queries/get-threads.query";
import type { ThreadSummary } from "@/types/email";

const { Text } = Typography;

interface TransportationRequestFormProps {
  form: FormInstance;
  initialValues?: Partial<TransportationRequestFormData>;
  onSubmit: (values: TransportationRequestFormData) => void;
}

const TransportationRequestForm: React.FC<TransportationRequestFormProps> = ({
  form,
  initialValues,
  onSubmit,
}) => {
  const [pasteValue, setPasteValue] = useState<string>("");

  // Fetch threads from all mailboxes for search
  const { data: threadsResponse } = useGetThreadsQuery({
    page: 1,
    limit: 100,
  });
  const threads = threadsResponse?.data || [];

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Format participants helper
  const formatParticipants = (participants: string[]) => {
    if (participants.length === 0) return "No participants";
    if (participants.length <= 2) {
      return participants.map((p) => p.split("@")[0]).join(", ");
    }
    return `${participants[0].split("@")[0]} +${participants.length - 1} more`;
  };

  // Initialize form with threadIds if provided
  React.useEffect(() => {
    if (initialValues?.threadIds && initialValues.threadIds.length > 0) {
      form.setFieldsValue({
        threadIds: initialValues.threadIds,
      });
    }
  }, [initialValues, form]);

  const handlePasteThreads = () => {
    if (!pasteValue.trim()) {
      message.warning("Please enter thread IDs to paste");
      return;
    }

    const currentThreadIds: string[] = form.getFieldValue("threadIds") || [];
    const newThreadIds = pasteValue
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id && !currentThreadIds.includes(id));

    if (newThreadIds.length === 0) {
      message.info("No new thread IDs to add");
      return;
    }

    form.setFieldsValue({
      threadIds: [...currentThreadIds, ...newThreadIds],
    });
    setPasteValue("");
    message.success(`Added ${newThreadIds.length} thread ID(s)`);
  };

  const handleFormFinish = (values: TransportationRequestFormData) => {
    const threadIds = Array.isArray(values.threadIds) ? values.threadIds : [];
    onSubmit({
      ...values,
      threadIds,
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFormFinish}
    >
      <Form.Item
        label="Pickup Address"
        name="pickupAddress"
        rules={[
          { required: true, message: "Please enter pickup address" },
          { max: 500, message: "Address must not exceed 500 characters" },
        ]}
      >
        <Input.TextArea
          rows={3}
          placeholder="Enter full pickup address"
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Form.Item
        label="Dropoff Address"
        name="dropoffAddress"
        rules={[
          { required: true, message: "Please enter dropoff address" },
          { max: 500, message: "Address must not exceed 500 characters" },
        ]}
      >
        <Input.TextArea
          rows={3}
          placeholder="Enter full dropoff address"
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Form.Item
        name="threadIds"
        label="Link Email Threads"
        tooltip="Search and select multiple threads, or paste thread IDs copied from conversations page"
      >
        <Select
          mode="multiple"
          showSearch
          placeholder="Search and select threads"
          allowClear
          maxTagCount="responsive"
          filterOption={(input, option) => {
            const thread = threads.find((t) => t.threadId === option?.value);
            if (!thread) return false;
            const searchText = input.toLowerCase();
            return (
              thread.subject.toLowerCase().includes(searchText) ||
              thread.participants.some((p) =>
                p.toLowerCase().includes(searchText),
              ) ||
              (thread.snippet || "").toLowerCase().includes(searchText)
            );
          }}
          options={threads.map((thread) => ({
            label: thread.subject || "(No Subject)",
            value: thread.threadId,
            thread: thread, // Store full thread object for custom rendering
          }))}
          optionRender={(option) => {
            const thread = option.data?.thread as ThreadSummary;
            if (!thread) return option.label;
            return (
              <div style={{ padding: "4px 0" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 4,
                  }}
                >
                  <Text strong style={{ fontSize: 14, flex: 1 }}>
                    {thread.subject || "(No Subject)"}
                  </Text>
                  {thread.latestDate && (
                    <Text
                      type="secondary"
                      style={{ fontSize: 12, marginLeft: 8 }}
                    >
                      {formatDate(thread.latestDate)}
                    </Text>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <Space size={4}>
                    <UserOutlined style={{ fontSize: 12, color: "#8c8c8c" }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatParticipants(thread.participants)}
                    </Text>
                  </Space>
                  <Space size={4}>
                    <MessageOutlined
                      style={{ fontSize: 12, color: "#8c8c8c" }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {thread.messageCount} message
                      {thread.messageCount !== 1 ? "s" : ""}
                    </Text>
                  </Space>
                </div>
                {thread.snippet && (
                  <Text
                    type="secondary"
                    ellipsis
                    style={{
                      fontSize: 12,
                      display: "block",
                      marginTop: 4,
                      color: "#8c8c8c",
                    }}
                  >
                    {thread.snippet}
                  </Text>
                )}
              </div>
            );
          }}
          tagRender={(props) => {
            const { label, value, closable, onClose } = props;
            const thread = threads.find((t) => t.threadId === value);
            const displayText = thread
              ? thread.subject || "(No Subject)"
              : label;
            return (
              <Tag
                closable={closable}
                onClose={onClose}
                color="blue"
                style={{ margin: "2px 4px" }}
              >
                {displayText}
                {thread && (
                  <span style={{ marginLeft: 4, opacity: 0.7 }}>
                    ({thread.messageCount})
                  </span>
                )}
              </Tag>
            );
          }}
          style={{ width: "100%" }}
          notFoundContent={threads.length === 0 ? "No threads found" : null}
        />
      </Form.Item>

      <Form.Item label=" " colon={false}>
        <Space.Compact style={{ width: "100%" }}>
          <AntInput
            placeholder="Or paste thread IDs (comma-separated)"
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            onPressEnter={handlePasteThreads}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handlePasteThreads}
          >
            Add
          </Button>
        </Space.Compact>
      </Form.Item>
    </Form>
  );
};

export default TransportationRequestForm;
