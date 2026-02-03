import React, { useState, useMemo } from "react";
import {
  Input,
  Avatar,
  Typography,
  Button,
  Tooltip,
  Spin,
  Empty,
  Tag,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  MailOutlined,
  InboxOutlined,
  SendOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  MoreOutlined,
  SyncOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { useQuery } from "@tanstack/react-query";
import {
  useGetEmailsQuery,
  useGetEmailsByMailboxQuery,
  useGetEmailQuery,
  useSearchEmailsQuery,
  useSyncMailboxCommand,
} from "@/services/emails";
import { useGetMailboxesQuery } from "@/services/mailboxes";
import { useMailboxStore } from "@/stores/mailbox.store";
import type { EmailListItem, EmailDetail } from "@/types/email";
import ComposeModal from "@/components/emails/ComposeModal";
import MailSidebar, {
  type MailSidebarFolder,
} from "@/components/emails/MailSidebar";

const { Text, Paragraph, Title } = Typography;

const primaryColor = "#0d7377";
const accentColor = "#b5892e";

const MailsOldArchitecture: React.FC = () => {
  const { isDark } = useTheme();
  const { emailId } = useParams<{ emailId?: string }>();
  const navigate = useNavigate();
  const { selectedMailboxId, setSelectedMailboxId, setLastUpdateAt } =
    useMailboxStore();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [starredEmails, setStarredEmails] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<EmailDetail | undefined>(
    undefined,
  );

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch mailboxes (for sync fallback)
  const { data: mailboxes = [] } = useGetMailboxesQuery();

  // Fetch emails based on selected mailbox and search
  const searchQuery = useSearchEmailsQuery(
    debouncedSearch,
    selectedMailboxId || undefined,
    currentPage,
    pageSize,
  );

  const emailsByMailboxQuery = useGetEmailsByMailboxQuery(
    selectedMailboxId || undefined,
    currentPage,
    pageSize,
  );

  const allEmailsQuery = useGetEmailsQuery(currentPage, pageSize);

  // Determine which query to use
  const emailsQuery = debouncedSearch
    ? searchQuery
    : selectedMailboxId
      ? emailsByMailboxQuery
      : allEmailsQuery;

  const {
    data: emailsResponse,
    isLoading: isLoadingEmails,
    isFetching: isFetchingEmails,
    dataUpdatedAt,
  } = emailsQuery;

  // Sync list last-update time to mailbox store for LiveUpdatesStatus
  React.useEffect(() => {
    setLastUpdateAt(dataUpdatedAt ?? null);
  }, [dataUpdatedAt, setLastUpdateAt]);

  // Fetch selected email details
  const { data: selectedEmail, isLoading: isLoadingDetail } =
    useGetEmailQuery(emailId);

  // Sync mutation
  const { syncMutation } = useSyncMailboxCommand();

  const emails = emailsResponse?.data || [];
  const totalEmails = emailsResponse?.total || 0;

  const sidebarFolders: MailSidebarFolder[] = useMemo(
    () => [
      {
        key: "all",
        label: "All Mail",
        icon: <MailOutlined />,
        count: totalEmails,
      },
      { key: "inbox", label: "Inbox", icon: <InboxOutlined /> },
      { key: "sent", label: "Sent", icon: <SendOutlined /> },
    ],
    [totalEmails],
  );

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredEmails((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  const getFromName = (email: EmailListItem) => {
    if (email.from?.displayName) return email.from.displayName;
    if (email.from?.emailAddress) return email.from.emailAddress.split("@")[0];
    return "Unknown";
  };

  const getFromEmail = (email: EmailListItem) => {
    return email.from?.emailAddress || "";
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

  const handleSync = () => {
    const mailboxId =
      selectedMailboxId || (mailboxes.length > 0 ? mailboxes[0].id : null);
    if (mailboxId) {
      syncMutation.mutate(mailboxId);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    navigate("/mails-old-architecture");
  };

  // Navigate emails with keyboard
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!emails.length) return;

      const currentIndex = emails.findIndex((em) => em.id === emailId);

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, emails.length - 1);
        navigate(`/mails-old-architecture/${emails[nextIndex].id}`);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        navigate(`/mails-old-architecture/${emails[prevIndex].id}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [emails, emailId, navigate]);

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
        {/* <MailSidebar folders={sidebarFolders} /> */}

        {/* Middle - Email List */}
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
              placeholder="Search emails..."
              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
              suffix={
                searchText && (
                  <Text style={{ fontSize: 11, color: "#8c8c8c" }}>
                    {totalEmails} results
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

          {/* Email List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {isLoadingEmails ? (
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
                <Text style={{ color: "#8c8c8c" }}>Loading emails...</Text>
              </div>
            ) : emails.length === 0 ? (
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
                      {searchText
                        ? "No emails match your search"
                        : "No emails yet"}
                    </span>
                  }
                />
                {!searchText && (
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
              emails.map((email: EmailListItem) => (
                <div
                  key={email.id}
                  onClick={() => navigate(`/mails-old-architecture/${email.id}`)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    backgroundColor:
                      emailId === email.id
                        ? isDark
                          ? "rgba(13, 115, 119, 0.15)"
                          : "rgba(13, 115, 119, 0.08)"
                        : "transparent",
                    borderLeft:
                      emailId === email.id
                        ? `3px solid ${primaryColor}`
                        : "3px solid transparent",
                    borderBottom: `1px solid ${isDark ? "#252525" : "#f0f0f0"}`,
                    transition: "all 0.15s",
                  }}
                >
                  <Tooltip title={getFromEmail(email)} placement="right">
                    <Avatar
                      size={42}
                      style={{
                        backgroundColor: getAvatarColor(getFromName(email)),
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    >
                      {getFromName(email).charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
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
                        {getFromName(email)}
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
                          {formatDate(email.receivedAt)}
                        </Text>
                        <span
                          onClick={(e) => toggleStar(email.id, e)}
                          style={{ cursor: "pointer", lineHeight: 1 }}
                        >
                          {starredEmails.has(email.id) ? (
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
                      {email.subject || "(No Subject)"}
                    </Paragraph>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Tag
                        style={{
                          fontSize: 10,
                          padding: "0 6px",
                          borderRadius: 4,
                          margin: 0,
                        }}
                        color={
                          email.direction === "incoming" ? "blue" : "green"
                        }
                      >
                        {email.direction === "incoming" ? "IN" : "OUT"}
                      </Tag>
                      {email.hasBody === false && (
                        <Tooltip title="No content preview">
                          <PaperClipOutlined
                            style={{ fontSize: 12, color: "#8c8c8c" }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalEmails > pageSize && (
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
                total={totalEmails}
                onChange={handlePageChange}
                size="small"
                showSizeChanger={false}
                showQuickJumper={false}
                simple
              />
            </div>
          )}
        </div>

        {/* Right - Email Detail */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {isLoadingDetail ? (
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
              <Text style={{ color: "#8c8c8c" }}>Loading email...</Text>
            </div>
          ) : selectedEmail ? (
            <>
              {/* Email Header */}
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
                    marginBottom: 12,
                  }}
                >
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                      color: isDark ? "#fff" : undefined,
                      flex: 1,
                      paddingRight: 16,
                    }}
                  >
                    {selectedEmail.subject || "(No Subject)"}
                  </Title>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {selectedEmail.direction === "incoming" && (
                      <Tooltip title="Reply">
                        <Button
                          type="text"
                          size="small"
                          onClick={() => {
                            setReplyToEmail(selectedEmail);
                            setComposeModalOpen(true);
                          }}
                        >
                          Reply
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip
                      title={
                        starredEmails.has(selectedEmail.id) ? "Unstar" : "Star"
                      }
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={
                          starredEmails.has(selectedEmail.id) ? (
                            <StarFilled style={{ color: accentColor }} />
                          ) : (
                            <StarOutlined />
                          )
                        }
                        onClick={(e) => toggleStar(selectedEmail.id, e)}
                      />
                    </Tooltip>
                    {/* <Tooltip title="Delete">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Tooltip> */}
                    <Button type="text" size="small" icon={<MoreOutlined />} />
                  </div>
                </div>

                {/* From/To Info */}
                <div style={{ display: "flex", gap: 16 }}>
                  <Avatar
                    size={44}
                    style={{
                      backgroundColor: getAvatarColor(
                        getParticipantsByType(
                          selectedEmail.participants,
                          "from",
                        ) || "U",
                      ),
                      flexShrink: 0,
                    }}
                  >
                    {(
                      getParticipantsByType(
                        selectedEmail.participants,
                        "from",
                      ) || "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 2,
                      }}
                    >
                      <Text
                        strong
                        style={{ color: isDark ? "#fff" : undefined }}
                      >
                        {getParticipantsByType(
                          selectedEmail.participants,
                          "from",
                        ) || "Unknown Sender"}
                      </Text>
                      <Text style={{ color: "#8c8c8c", fontSize: 12 }}>
                        &lt;
                        {getParticipantEmailsByType(
                          selectedEmail.participants,
                          "from",
                        )}
                        &gt;
                      </Text>
                    </div>
                    <Text style={{ color: "#8c8c8c", fontSize: 13 }}>
                      To:{" "}
                      {getParticipantsByType(
                        selectedEmail.participants,
                        "to",
                      ) || "Unknown"}
                    </Text>
                    {getParticipantsByType(
                      selectedEmail.participants,
                      "cc",
                    ) && (
                      <div>
                        <Text style={{ color: "#8c8c8c", fontSize: 13 }}>
                          Cc:{" "}
                          {getParticipantsByType(
                            selectedEmail.participants,
                            "cc",
                          )}
                        </Text>
                      </div>
                    )}
                    <Text
                      style={{
                        color: "#8c8c8c",
                        fontSize: 12,
                        display: "block",
                        marginTop: 4,
                      }}
                    >
                      {formatFullDate(selectedEmail.receivedAt)}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div
                style={{
                  flex: 1,
                  padding: 24,
                  overflowY: "auto",
                  background: isDark ? "#1a1a1a" : "#fafafa",
                }}
              >
                <div
                  style={{
                    background: isDark ? "#141414" : "#fff",
                    borderRadius: 8,
                    padding: 24,
                    minHeight: 200,
                    boxShadow: isDark
                      ? "0 1px 3px rgba(0,0,0,0.3)"
                      : "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  {selectedEmail.bodyHtml ? (
                    <div
                      className="email-content"
                      style={{
                        color: isDark ? "#d9d9d9" : "#333",
                        lineHeight: 1.7,
                        fontSize: 14,
                      }}
                      dangerouslySetInnerHTML={{
                        __html: stripQuotedReplies(selectedEmail.bodyHtml),
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
                      {selectedEmail.bodyText || "(No content)"}
                    </Paragraph>
                  )}
                </div>
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
                  Select an email to view
                </Text>
                <Text style={{ color: "#8c8c8c", fontSize: 12 }}>
                  Use ↑↓ or j/k to navigate
                </Text>
              </div>
            </div>
          )}
        </div>
      </div>

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

      {/* Compose Modal */}
      <ComposeModal
        open={composeModalOpen}
        onClose={() => {
          setComposeModalOpen(false);
          setReplyToEmail(undefined);
        }}
        replyTo={replyToEmail}
      />
    </>
  );
};

export default MailsOldArchitecture;
