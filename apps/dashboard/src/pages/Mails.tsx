import React, { useState } from "react";
import {
  Input,
  Avatar,
  Typography,
  Button,
  Tooltip,
  Spin,
  Empty,
  message,
  Tag,
  Pagination,
  Collapse,
  Badge,
} from "antd";
import {
  SearchOutlined,
  MailOutlined,
  InboxOutlined,
  SendOutlined,
  StarOutlined,
  StarFilled,
  MoreOutlined,
  SyncOutlined,
  DownOutlined,
  RightOutlined,
  UserOutlined,
  CopyOutlined,
  FullscreenOutlined,
  ShrinkOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import {
  useGetThreadsQuery,
  useGetThreadQuery,
  useSyncMailboxCommand,
} from "@/services/emails";
import { useGetMailboxesQuery } from "@/services/mailboxes";
import { useMailboxStore } from "@/stores/mailbox.store";
import type {
  ThreadSummary,
  EmailDetail,
  EmailParticipant,
} from "@/types/email";
import MailSidebar from "@/components/emails/MailSidebar";
import ComposeModal from "@/components/emails/ComposeModal";
import { apiClient } from "@/api/client";

const { Text, Paragraph, Title } = Typography;

const primaryColor = "#0d7377";
const accentColor = "#b5892e";

type RecipientInput = { email: string; name?: string };

function buildReplyAllRecipients(
  message: EmailDetail,
  excludeAddress: string,
): { to: RecipientInput[]; cc: RecipientInput[] } {
  const exclude = excludeAddress.trim().toLowerCase();
  const toParticipants = message.participants.filter(
    (p: EmailParticipant) =>
      (p.type === "from" || p.type === "to") &&
      p.emailAddress.trim().toLowerCase() !== exclude,
  );
  const ccParticipants = message.participants.filter(
    (p: EmailParticipant) =>
      p.type === "cc" && p.emailAddress.trim().toLowerCase() !== exclude,
  );
  const dedupe = (list: EmailParticipant[]): RecipientInput[] => {
    const seen = new Set<string>();
    return list
      .filter((p) => {
        const key = p.emailAddress.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((p) => ({
        email: p.emailAddress,
        name: p.displayName || undefined,
      }));
  };
  return {
    to: dedupe(toParticipants),
    cc: dedupe(ccParticipants),
  };
}

const Mails: React.FC = () => {
  const { isDark } = useTheme();
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedMailboxId, setSelectedMailboxId, setLastUpdateAt } =
    useMailboxStore();
  const [searchText, setSearchText] = useState("");

  // When opened from browser notification with only emailId (no threadId): fetch email and go to thread
  const openEmailId = searchParams.get("openEmailId");
  React.useEffect(() => {
    if (!openEmailId) return;
    let cancelled = false;
    (async () => {
      try {
        const email = await apiClient
          .get(`emails/${openEmailId}`)
          .json<EmailDetail>();
        if (cancelled) return;
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("openEmailId");
          return next;
        }, { replace: true });
        if (email.threadId) {
          navigate(`/mails/${email.threadId}`, { replace: true });
        }
      } catch {
        if (!cancelled) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete("openEmailId");
            return next;
          }, { replace: true });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openEmailId, setSearchParams, navigate]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [starredThreads, setStarredThreads] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set(),
  );
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<EmailDetail | null>(
    null,
  );
  const [composeInitialToRecipients, setComposeInitialToRecipients] = useState<
    RecipientInput[] | undefined
  >(undefined);
  const [composeInitialCcRecipients, setComposeInitialCcRecipients] = useState<
    RecipientInput[] | undefined
  >(undefined);
  const pageSize = 20;

  // Debounce search and reset to page 1 when search changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch mailboxes (for sync fallback)
  const { data: mailboxes = [] } = useGetMailboxesQuery();

  // Fetch threads (with optional search via API)
  const {
    data: threadsResponse,
    isLoading: isLoadingThreads,
    isFetching: isFetchingThreads,
    dataUpdatedAt,
  } = useGetThreadsQuery({
    mailboxId: selectedMailboxId || undefined,
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch || undefined,
  });

  // Sync list last-update time to mailbox store for LiveUpdatesStatus
  React.useEffect(() => {
    setLastUpdateAt(dataUpdatedAt ?? null);
  }, [dataUpdatedAt, setLastUpdateAt]);

  // Fetch selected thread details
  const { data: selectedThread, isLoading: isLoadingThread } =
    useGetThreadQuery(threadId);

  // Sync mutation
  const { syncMutation } = useSyncMailboxCommand();

  const threads = threadsResponse?.data || [];
  const totalThreads = threadsResponse?.total || 0;

  // Expand the latest message by default when thread changes
  React.useEffect(() => {
    if (selectedThread && selectedThread.messages.length > 0) {
      const latestMessageId =
        selectedThread.messages[selectedThread.messages.length - 1].id;
      setExpandedMessages(new Set([latestMessageId]));
    }
  }, [selectedThread]);

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleMessageExpand = (messageId: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  // const expandAllMessages = () => {
  //   if (selectedThread) {
  //     setExpandedMessages(new Set(selectedThread.messages.map((m) => m.id)));
  //   }
  // };

  // const collapseAllMessages = () => {
  //   if (selectedThread && selectedThread.messages.length > 0) {
  //     // Keep only the latest message expanded
  //     const latestMessageId =
  //       selectedThread.messages[selectedThread.messages.length - 1].id;
  //     setExpandedMessages(new Set([latestMessageId]));
  //   }
  // };

  const getAvatarColor = (name: string) => {
    const colors = [
      "#0d7377",
      "#b5892e",
      "#22c55e",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatFullDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const stripQuotedReplies = (html: string): string => {
    if (!html) return html;

    const root = document.createElement("div");
    root.innerHTML = html;

    const quote = root.querySelector(
      ".gmail_quote, .gmail_quote_container, blockquote, .AppleMailQuote, .yahoo_quoted",
    );

    if (quote) {
      const container = quote.closest("div, blockquote") ?? quote;
      let node: ChildNode | null = container;
      while (node) {
        const next = node.nextSibling;
        node.remove();
        node = next;
      }
    }

    return root.innerHTML.trim();
  };

  const getParticipantsByType = (
    participants: EmailDetail["participants"],
    type: string,
  ) => {
    return participants
      .filter((p) => p.type === type)
      .map((p) => p.displayName || p.emailAddress)
      .join(", ");
  };

  const getParticipantEmailsByType = (
    participants: EmailDetail["participants"],
    type: string,
  ) => {
    return participants
      .filter((p) => p.type === type)
      .map((p) => p.emailAddress)
      .join(", ");
  };

  const getThreadParticipantsDisplay = (participants: string[]) => {
    if (participants.length <= 2) {
      return participants.map((p) => p.split("@")[0]).join(", ");
    }
    return `${participants[0].split("@")[0]} +${participants.length - 1}`;
  };

  const handleSync = () => {
    const mailboxId =
      selectedMailboxId || (mailboxes.length > 0 ? mailboxes[0].id : null);
    if (mailboxId) {
      syncMutation.mutate(mailboxId);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    navigate("/mails");
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 112px)",
          background: isDark ? "#141414" : "#fff",
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
        }}
      >
        {/* <MailSidebar /> */}

        {/* Middle - Thread List */}
        <div
          style={{
            width: 380,
            borderRight: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search */}
          <div style={{ padding: 16 }}>
            <Input
              placeholder="Search conversations (subject, body)..."
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              suffix={
                debouncedSearch && (
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>
                    {totalThreads} result{totalThreads !== 1 ? "s" : ""}
                  </Text>
                )
              }
              style={{
                borderRadius: 8,
                backgroundColor: isDark ? "#1f1f1f" : "#f5f5f5",
                border: "none",
              }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </div>

          {/* Thread List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {isLoadingThreads ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 60,
                  gap: 12,
                }}
              >
                <Spin size="large" />
                <Text style={{ color: "#8c8c8c" }}>
                  Loading conversations...
                </Text>
              </div>
            ) : threads.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 60,
                  gap: 16,
                }}
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ color: "#8c8c8c" }}>
                      {debouncedSearch
                        ? "No conversations match your search"
                        : "No conversations yet"}
                    </span>
                  }
                />
                {!debouncedSearch && (
                  <Button
                    type="primary"
                    icon={<SyncOutlined />}
                    onClick={handleSync}
                    loading={syncMutation.isPending}
                  >
                    Sync Emails
                  </Button>
                )}
              </div>
            ) : (
              threads.map((thread: ThreadSummary) => (
                <div
                  key={thread.threadId}
                  onClick={() => navigate(`/mails/${thread.threadId}`)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    backgroundColor:
                      threadId === thread.threadId
                        ? isDark
                          ? "rgba(13, 115, 119, 0.15)"
                          : "rgba(13, 115, 119, 0.08)"
                        : "transparent",
                    borderLeft:
                      threadId === thread.threadId
                        ? `3px solid ${primaryColor}`
                        : "3px solid transparent",
                    borderBottom: `1px solid ${isDark ? "#252525" : "#f0f0f0"}`,
                    transition: "all 0.15s",
                  }}
                >
                  {/* Avatar Stack for multiple participants */}
                  <div style={{ position: "relative", width: 42, height: 42 }}>
                    <Avatar
                      size={42}
                      style={{
                        backgroundColor: getAvatarColor(
                          thread.participants[0] || "U",
                        ),
                      }}
                    >
                      {(thread.participants[0] || "U").charAt(0).toUpperCase()}
                    </Avatar>
                    {thread.messageCount > 1 && (
                      <Badge
                        count={thread.messageCount}
                        size="small"
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          backgroundColor: primaryColor,
                        }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 3,
                      }}
                    >
                      <Text
                        strong
                        style={{
                          color: isDark ? "#fff" : "#333",
                          fontSize: 14,
                          maxWidth: 180,
                        }}
                        ellipsis
                      >
                        {getThreadParticipantsDisplay(thread.participants)}
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#8c8c8c",
                            flexShrink: 0,
                          }}
                        >
                          {formatDate(thread.latestDate)}
                        </Text>
                        <Tooltip title="Copy Thread ID">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(thread.threadId);
                              message.success("Thread ID copied to clipboard");
                            }}
                            style={{ cursor: "pointer", lineHeight: 1 }}
                          >
                            <CopyOutlined
                              style={{ color: "#8c8c8c", fontSize: 14 }}
                            />
                          </span>
                        </Tooltip>
                        <span
                          onClick={(e) => toggleStar(thread.threadId, e)}
                          style={{ cursor: "pointer", lineHeight: 1 }}
                        >
                          {starredThreads.has(thread.threadId) ? (
                            <StarFilled
                              style={{ color: accentColor, fontSize: 14 }}
                            />
                          ) : (
                            <StarOutlined
                              style={{ color: "#8c8c8c", fontSize: 14 }}
                            />
                          )}
                        </span>
                      </div>
                    </div>
                    <Paragraph
                      ellipsis
                      style={{
                        margin: 0,
                        marginBottom: 2,
                        fontSize: 13,
                        color: isDark ? "#e0e0e0" : "#333",
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {thread.subject || "(No Subject)"}
                    </Paragraph>
                    <Paragraph
                      ellipsis
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "#8c8c8c",
                        lineHeight: 1.4,
                      }}
                    >
                      {thread.snippet || ""}
                    </Paragraph>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalThreads > pageSize && (
            <div
              style={{
                padding: "12px 16px",
                borderTop: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalThreads}
                onChange={handlePageChange}
                size="small"
                showSizeChanger={false}
                showQuickJumper={false}
                simple
              />
            </div>
          )}
        </div>

        {/* Right - Conversation View */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {isLoadingThread ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <Spin size="large" />
              <Text style={{ color: "#8c8c8c" }}>Loading conversation...</Text>
            </div>
          ) : selectedThread ? (
            <>
              {/* Thread Header */}
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <Title
                      level={5}
                      style={{
                        margin: 0,
                        color: isDark ? "#fff" : undefined,
                        marginBottom: 4,
                      }}
                    >
                      {selectedThread.subject || "(No Subject)"}
                    </Title>
                    <Text style={{ color: "#8c8c8c", fontSize: 13 }}>
                      {selectedThread.messageCount} message
                      {selectedThread.messageCount > 1 ? "s" : ""} in this
                      conversation
                    </Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0,
                      background: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.02)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                      borderRadius: 8,
                      padding: 4,
                    }}
                  >
                    <Tooltip title="Copy Thread ID">
                      <Button
                        size="small"
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          if (selectedThread) {
                            navigator.clipboard.writeText(
                              selectedThread.threadId,
                            );
                            message.success("Thread ID copied to clipboard");
                          }
                        }}
                        style={{
                          color: isDark
                            ? "rgba(255,255,255,0.85)"
                            : "rgba(0,0,0,0.88)",
                        }}
                      >
                        Copy Thread ID
                      </Button>
                    </Tooltip>
                    <div
                      style={{
                        width: 1,
                        height: 20,
                        background: isDark
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(0,0,0,0.08)",
                        margin: "0 4px",
                      }}
                    />
                    {/* <Tooltip title="Expand all messages in this thread">
                      <Button
                        size="small"
                        type={
                          selectedThread &&
                          selectedThread.messages.length > 0 &&
                          expandedMessages.size ===
                            selectedThread.messages.length
                            ? "primary"
                            : "text"
                        }
                        icon={<FullscreenOutlined />}
                        onClick={expandAllMessages}
                        style={
                          selectedThread &&
                          selectedThread.messages.length > 0 &&
                          expandedMessages.size ===
                            selectedThread.messages.length
                            ? undefined
                            : {
                                color: isDark
                                  ? "rgba(255,255,255,0.85)"
                                  : "rgba(0,0,0,0.88)",
                              }
                        }
                      >
                        Expand All
                      </Button>
                    </Tooltip>
                    <Tooltip title="Collapse all except the latest message">
                      <Button
                        size="small"
                        type={
                          selectedThread &&
                          selectedThread.messages.length > 0 &&
                          expandedMessages.size <= 1
                            ? "primary"
                            : "text"
                        }
                        icon={<ShrinkOutlined />}
                        onClick={collapseAllMessages}
                        style={
                          selectedThread &&
                          selectedThread.messages.length > 0 &&
                          expandedMessages.size <= 1
                            ? undefined
                            : {
                                color: isDark
                                  ? "rgba(255,255,255,0.85)"
                                  : "rgba(0,0,0,0.88)",
                              }
                        }
                      >
                        Collapse
                      </Button>
                    </Tooltip> */}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  padding: 24,
                  overflowY: "auto",
                  background: isDark ? "#1a1a1a" : "#fafafa",
                }}
              >
                {selectedThread.messages.map((email, index) => {
                  const isExpanded = expandedMessages.has(email.id);
                  const fromName = getParticipantsByType(
                    email.participants,
                    "from",
                  );
                  const fromEmail = getParticipantEmailsByType(
                    email.participants,
                    "from",
                  );
                  const isLatest = index === selectedThread.messages.length - 1;

                  return (
                    <div
                      key={email.id}
                      style={{
                        background: isDark ? "#141414" : "#fff",
                        borderRadius: 8,
                        marginBottom: 12,
                        boxShadow: isDark
                          ? "0 1px 3px rgba(0,0,0,0.3)"
                          : "0 1px 3px rgba(0,0,0,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Message Header (always visible) */}
                      <div
                        onClick={() => toggleMessageExpand(email.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderBottom: isExpanded
                            ? `1px solid ${isDark ? "#303030" : "#e8e8e8"}`
                            : "none",
                        }}
                      >
                        {isExpanded ? (
                          <DownOutlined
                            style={{ color: "#8c8c8c", fontSize: 12 }}
                          />
                        ) : (
                          <RightOutlined
                            style={{ color: "#8c8c8c", fontSize: 12 }}
                          />
                        )}
                        <Avatar
                          size={36}
                          style={{
                            backgroundColor: getAvatarColor(fromName || "U"),
                            flexShrink: 0,
                          }}
                        >
                          {(fromName || "U").charAt(0).toUpperCase()}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Text
                              strong
                              style={{
                                color: isDark ? "#fff" : undefined,
                                fontSize: 14,
                              }}
                            >
                              {fromName || "Unknown Sender"}
                            </Text>
                            {isLatest && (
                              <Tag
                                color={primaryColor}
                                style={{
                                  fontSize: 10,
                                  padding: "0 4px",
                                  margin: 0,
                                }}
                              >
                                Latest
                              </Tag>
                            )}
                          </div>
                          {!isExpanded && (
                            <Paragraph
                              ellipsis
                              style={{
                                margin: 0,
                                fontSize: 12,
                                color: "#8c8c8c",
                              }}
                            >
                              {email.bodyText?.substring(0, 100) || ""}
                            </Paragraph>
                          )}
                        </div>
                        <Text
                          style={{
                            color: "#8c8c8c",
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {formatFullDate(email.receivedAt)}
                        </Text>
                      </div>

                      {/* Message Body (when expanded) */}
                      {isExpanded && (
                        <div style={{ padding: "16px 24px" }}>
                          {/* To/Cc info */}
                          <div style={{ marginBottom: 16 }}>
                            <Text style={{ color: "#8c8c8c", fontSize: 12 }}>
                              From: {fromName} &lt;{fromEmail}&gt;
                            </Text>
                            <br />
                            <Text style={{ color: "#8c8c8c", fontSize: 12 }}>
                              To:{" "}
                              {getParticipantsByType(email.participants, "to")}
                            </Text>
                            {getParticipantsByType(
                              email.participants,
                              "cc",
                            ) && (
                              <>
                                <br />
                                <Text
                                  style={{ color: "#8c8c8c", fontSize: 12 }}
                                >
                                  Cc:{" "}
                                  {getParticipantsByType(
                                    email.participants,
                                    "cc",
                                  )}
                                </Text>
                              </>
                            )}
                          </div>

                          {/* Email Content */}
                          {email.bodyHtml ? (
                            <div
                              className="email-content"
                              style={{
                                color: isDark ? "#d9d9d9" : "#333",
                                lineHeight: 1.7,
                                fontSize: 14,
                              }}
                              dangerouslySetInnerHTML={{
                                // __html: stripQuotedReplies(email.bodyHtml),
                                __html: email.bodyHtml,
                              }}
                            />
                          ) : (
                            <Paragraph
                              style={{
                                color: isDark ? "#d9d9d9" : "#333",
                                lineHeight: 1.7,
                                fontSize: 14,
                                whiteSpace: "pre-wrap",
                                margin: 0,
                              }}
                            >
                              {email.bodyText || "(No content)"}
                            </Paragraph>
                          )}

                          {/* Attachments */}
                          {email.attachments &&
                            email.attachments.length > 0 && (
                              <div
                                style={{
                                  marginTop: 16,
                                  paddingTop: 16,
                                  borderTop: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
                                }}
                              >
                                <Text
                                  style={{
                                    color: isDark ? "#8c8c8c" : "#595959",
                                    fontSize: 12,
                                    marginBottom: 8,
                                    display: "block",
                                  }}
                                >
                                  <PaperClipOutlined
                                    style={{ marginRight: 6 }}
                                  />
                                  Attachments ({email.attachments.length})
                                </Text>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,
                                  }}
                                >
                                  {email.attachments.map((att) => (
                                    <a
                                      key={att.id}
                                      href={att.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "6px 12px",
                                        background: isDark
                                          ? "rgba(255,255,255,0.06)"
                                          : "rgba(0,0,0,0.04)",
                                        borderRadius: 6,
                                        color: primaryColor,
                                        fontSize: 13,
                                        textDecoration: "none",
                                        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                                      }}
                                    >
                                      <PaperClipOutlined />
                                      <span
                                        style={{
                                          maxWidth: 200,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                        title={att.filename}
                                      >
                                        {att.filename}
                                      </span>
                                      <span
                                        style={{
                                          color: isDark ? "#8c8c8c" : "#8c8c8c",
                                          fontSize: 11,
                                        }}
                                      >
                                        ({formatFileSize(att.size)})
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reply Bar */}
              <div
                style={{
                  padding: "12px 24px",
                  borderTop: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
                  display: "flex",
                  gap: 12,
                }}
              >
                <Button
                  type="primary"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => {
                    const latest =
                      selectedThread.messages[
                        selectedThread.messages.length - 1
                      ];
                    setReplyToMessage(latest);
                    setComposeInitialToRecipients(undefined);
                    setComposeInitialCcRecipients(undefined);
                    setComposeOpen(true);
                  }}
                >
                  Reply
                </Button>
                <Button
                  onClick={() => {
                    const latest =
                      selectedThread.messages[
                        selectedThread.messages.length - 1
                      ];
                    const mailboxAddress =
                      mailboxes.find((m) => m.id === selectedMailboxId)
                        ?.address ?? "";
                    const { to, cc } = buildReplyAllRecipients(
                      latest,
                      mailboxAddress,
                    );
                    setReplyToMessage(latest);
                    setComposeInitialToRecipients(to);
                    setComposeInitialCcRecipients(cc);
                    setComposeOpen(true);
                  }}
                >
                  Reply All
                </Button>
                {/* <Button>Forward</Button> */}
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#8c8c8c",
                gap: 16,
              }}
            >
              <InboxOutlined style={{ fontSize: 64, opacity: 0.3 }} />
              <div style={{ textAlign: "center" }}>
                <Text
                  style={{
                    color: isDark ? "#8c8c8c" : "#666",
                    fontSize: 16,
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Select a conversation to view
                </Text>
                <Text style={{ color: "#8c8c8c", fontSize: 12 }}>
                  Click on a thread to see the full conversation
                </Text>
              </div>
            </div>
          )}
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => {
          setComposeOpen(false);
          setReplyToMessage(null);
          setComposeInitialToRecipients(undefined);
          setComposeInitialCcRecipients(undefined);
        }}
        replyTo={replyToMessage ?? undefined}
        initialToRecipients={composeInitialToRecipients}
        initialCcRecipients={composeInitialCcRecipients}
      />

      {/* Custom styles for email content */}
      <style>{`
        .email-content img {
          max-width: 100%;
          height: auto;
        }
        .email-content a {
          color: ${primaryColor};
        }
        .email-content table {
          max-width: 100%;
          overflow-x: auto;
        }
        .email-content blockquote {
          border-left: 3px solid ${isDark ? "#303030" : "#e8e8e8"};
          padding-left: 12px;
          margin-left: 0;
          color: ${isDark ? "#8c8c8c" : "#666"};
        }
      `}</style>
    </>
  );
};

export default Mails;
