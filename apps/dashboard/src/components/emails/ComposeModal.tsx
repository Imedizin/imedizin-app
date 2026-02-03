import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  message,
} from "antd";
import {
  SendOutlined,
  DeleteOutlined,
  MinusOutlined,
  CloseOutlined,
  PlusOutlined,
  PaperClipOutlined,
  ExpandOutlined,
  CompressOutlined,
} from "@ant-design/icons";
import { useTheme } from "@/hooks/useTheme";
import {
  useSendEmailCommand,
  type EmailRecipient,
} from "@/services/emails/commands";
import { useMailboxStore } from "@/stores/mailbox.store";
import type { EmailDetail } from "@/types/email";
import { EmailRecipientField, type RecipientItem } from "./EmailRecipientField";

const { TextArea } = Input;
const { Text } = Typography;

interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
  replyTo?: EmailDetail;
  initialTo?: string;
  initialSubject?: string;
  /** Reply All: pre-fill To (from + to, excluding current mailbox) */
  initialToRecipients?: RecipientItem[];
  /** Reply All: pre-fill CC (excluding current mailbox) */
  initialCcRecipients?: RecipientItem[];
}

const ComposeModal: React.FC<ComposeModalProps> = ({
  open,
  onClose,
  replyTo,
  initialTo,
  initialSubject,
  initialToRecipients,
  initialCcRecipients,
}) => {
  const { isDark } = useTheme();
  const { sendEmailMutation } = useSendEmailCommand();
  const { selectedMailboxId } = useMailboxStore();

  const MINIMIZED_WIDTH = 320;
  const MINIMIZED_HEIGHT = 60;
  const CORNER_GAP = 24;
  const MAXIMIZE_MARGIN = 32;

  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 600, height: 600 });
  const expandedPositionRef = useRef<{ x: number; y: number } | null>(null);
  const beforeMaximizeRef = useRef<{
    position: { x: number; y: number };
    size: { width: number; height: number };
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [toRecipients, setToRecipients] = useState<RecipientItem[]>([]);
  const [ccRecipients, setCcRecipients] = useState<RecipientItem[]>([]);
  const [bccRecipients, setBccRecipients] = useState<RecipientItem[]>([]);
  const [toInputValue, setToInputValue] = useState("");
  const [ccInputValue, setCcInputValue] = useState("");
  const [bccInputValue, setBccInputValue] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const primaryColor = "#0d7377";

  // Initialize form when modal opens or replyTo changes
  useEffect(() => {
    if (open) {
      // Handle reply / reply all
      if (replyTo) {
        if (
          initialToRecipients &&
          Array.isArray(initialToRecipients) &&
          initialToRecipients.length > 0
        ) {
          setToRecipients(initialToRecipients);
          setCcRecipients(
            initialCcRecipients && initialCcRecipients.length > 0
              ? initialCcRecipients
              : [],
          );
          setShowCc(!!(initialCcRecipients && initialCcRecipients.length > 0));
        } else {
          const fromParticipant = replyTo.participants.find(
            (p) => p.type === "from",
          );
          if (fromParticipant) {
            setToRecipients([
              {
                email: fromParticipant.emailAddress,
                name: fromParticipant.displayName || undefined,
              },
            ]);
          }
          setCcRecipients([]);
          setShowCc(false);
        }
        setSubject(
          replyTo.subject.startsWith("Re:")
            ? replyTo.subject
            : `Re: ${replyTo.subject}`,
        );
        setBody("\n\n---\n" + (replyTo.bodyText || ""));
      } else if (initialTo) {
        setToRecipients([{ email: initialTo }]);
      }

      if (initialSubject) {
        setSubject(initialSubject);
      }

      // Reset position and size
      setPosition({ x: window.innerWidth - 620, y: window.innerHeight - 640 });
      setSize({ width: 600, height: 600 });
      setIsMinimized(false);
      setIsMaximized(false);
      beforeMaximizeRef.current = null;
      setToInputValue("");
      setCcInputValue("");
      setBccInputValue("");
    }
  }, [
    open,
    replyTo,
    initialTo,
    initialSubject,
    initialToRecipients,
    initialCcRecipients,
  ]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized || isMaximized) return;
    if (headerRef.current?.contains(e.target as Node)) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMinimized && !isMaximized) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({
          x: Math.max(0, Math.min(newX, window.innerWidth - size.width)),
          y: Math.max(
            0,
            Math.min(
              newY,
              window.innerHeight -
                (isMinimized ? MINIMIZED_HEIGHT : size.height),
            ),
          ),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position, size, isMinimized, isMaximized]);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (isResizing && !isMinimized && !isMaximized) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        setSize({
          width: Math.max(
            400,
            Math.min(
              resizeStart.width + deltaX,
              window.innerWidth - position.x,
            ),
          ),
          height: Math.max(
            300,
            Math.min(
              resizeStart.height + deltaY,
              window.innerHeight - position.y,
            ),
          ),
        });
      }
    };

    const handleResizeUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeUp);
      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeUp);
      };
    }
  }, [isResizing, resizeStart, position, isMinimized, isMaximized]);

  // Send email
  const handleSend = () => {
    if (!selectedMailboxId) {
      message.error("Please select a mailbox");
      return;
    }

    if (toRecipients.length === 0) {
      message.error("Please enter at least one recipient");
      return;
    }

    if (!subject.trim()) {
      message.error("Please enter a subject");
      return;
    }

    if (!body.trim()) {
      message.error("Please enter a message");
      return;
    }

    const recipients: EmailRecipient[] = toRecipients.map((r) => ({
      emailAddress: r.email,
      displayName: r.name,
    }));

    const cc: EmailRecipient[] | undefined =
      ccRecipients.length > 0
        ? ccRecipients.map((r) => ({
            emailAddress: r.email,
            displayName: r.name,
          }))
        : undefined;

    const bcc: EmailRecipient[] | undefined =
      bccRecipients.length > 0
        ? bccRecipients.map((r) => ({
            emailAddress: r.email,
            displayName: r.name,
          }))
        : undefined;

    sendEmailMutation.mutate(
      {
        mailboxId: selectedMailboxId,
        subject: subject.trim(),
        to: recipients,
        cc,
        bcc,
        bodyText: body.trim(),
        inReplyTo: replyTo?.messageId,
        references: replyTo?.references || undefined,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  // Close and reset
  const handleClose = () => {
    setToRecipients([]);
    setCcRecipients([]);
    setBccRecipients([]);
    setToInputValue("");
    setCcInputValue("");
    setBccInputValue("");
    setSubject("");
    setBody("");
    setShowCc(false);
    setShowBcc(false);
    setIsMinimized(false);
    setIsMaximized(false);
    beforeMaximizeRef.current = null;
    onClose();
  };

  const getMinimizedPosition = () => ({
    x: window.innerWidth - MINIMIZED_WIDTH - CORNER_GAP,
    y: window.innerHeight - MINIMIZED_HEIGHT - CORNER_GAP,
  });

  const getMaximizedPosition = () => ({
    x: MAXIMIZE_MARGIN,
    y: MAXIMIZE_MARGIN,
  });

  const getMaximizedSize = () => ({
    width: window.innerWidth - MAXIMIZE_MARGIN * 2,
    height: window.innerHeight - MAXIMIZE_MARGIN * 2,
  });

  // Maximize: fill screen with margin (floating); restore: back to previous position/size
  const toggleMaximize = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isMinimized) return; // no maximize when minimized
    if (!isMaximized) {
      beforeMaximizeRef.current = {
        position: { ...position },
        size: { ...size },
      };
      setPosition(getMaximizedPosition());
      setSize(getMaximizedSize());
      setIsMaximized(true);
    } else {
      const prev = beforeMaximizeRef.current;
      if (prev) {
        setPosition(prev.position);
        setSize(prev.size);
      }
      beforeMaximizeRef.current = null;
      setIsMaximized(false);
    }
  };

  // When minimizing: move to bottom-right corner (Gmail style)
  const toggleMinimize = () => {
    if (!isMinimized) {
      const positionToRestoreLater =
        isMaximized && beforeMaximizeRef.current
          ? beforeMaximizeRef.current.position
          : { ...position };
      if (isMaximized) {
        const prev = beforeMaximizeRef.current;
        if (prev) {
          setPosition(prev.position);
          setSize(prev.size);
        }
        beforeMaximizeRef.current = null;
        setIsMaximized(false);
      }
      expandedPositionRef.current = positionToRestoreLater;
      setPosition(getMinimizedPosition());
      setIsMinimized(true);
    } else {
      setPosition(
        expandedPositionRef.current ?? {
          x: window.innerWidth - 620,
          y: window.innerHeight - 640,
        },
      );
      expandedPositionRef.current = null;
      setIsMinimized(false);
    }
  };

  // Keep minimized bar in bottom-right on window resize
  useEffect(() => {
    if (!isMinimized) return;
    const onResize = () => setPosition(getMinimizedPosition());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isMinimized]);

  // Keep maximized modal filling viewport on window resize
  useEffect(() => {
    if (!isMaximized) return;
    const onResize = () => {
      setPosition(getMaximizedPosition());
      setSize(getMaximizedSize());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isMaximized]);

  if (!open) return null;

  return (
    <div
      ref={modalRef}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? MINIMIZED_WIDTH : `${size.width}px`,
        height: isMinimized ? MINIMIZED_HEIGHT : `${size.height}px`,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        background: isDark ? "#1f1f1f" : "#fff",
        borderRadius: "8px 8px 0 0",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        border: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
        transition: isDragging || isResizing ? "none" : "all 0.2s",
        cursor: isDragging ? "grabbing" : "default",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        ref={headerRef}
        style={{
          padding: "8px 12px",
          background: isDark ? "#141414" : "#f5f5f5",
          borderBottom: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
          borderRadius: "8px 8px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: isMinimized || isMaximized ? "default" : "grab",
          userSelect: "none",
        }}
      >
        <Text
          strong
          style={{ color: isDark ? "#fff" : undefined, fontSize: 13 }}
        >
          {isMinimized ? (replyTo ? "Reply" : "New Message") : "New Message"}
        </Text>
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={isMinimized ? <PlusOutlined /> : <MinusOutlined />}
            onClick={toggleMinimize}
            style={{ fontSize: 12 }}
          />
          <Button
            type="text"
            size="small"
            icon={isMaximized ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={toggleMaximize}
            disabled={isMinimized}
            title={isMaximized ? "Restore" : "Maximize"}
            style={{ fontSize: 12 }}
          />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleClose}
            style={{ fontSize: 12 }}
          />
        </Space>
      </div>

      {!isMinimized && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <EmailRecipientField
              label="To"
              placeholder="Recipients"
              value={toInputValue}
              onChange={setToInputValue}
              recipients={toRecipients}
              onRecipientsChange={setToRecipients}
              borderColor={isDark ? "#303030" : "#e8e8e8"}
            />

            {showCc && (
              <EmailRecipientField
                label="Cc"
                placeholder="Cc"
                value={ccInputValue}
                onChange={setCcInputValue}
                recipients={ccRecipients}
                onRecipientsChange={setCcRecipients}
                borderColor={isDark ? "#303030" : "#e8e8e8"}
              />
            )}

            {showBcc && (
              <EmailRecipientField
                label="Bcc"
                placeholder="Bcc"
                value={bccInputValue}
                onChange={setBccInputValue}
                recipients={bccRecipients}
                onRecipientsChange={setBccRecipients}
                borderColor={isDark ? "#303030" : "#e8e8e8"}
              />
            )}

            {/* Cc/Bcc Toggle - only show when at least one link is visible */}
            {(!showCc || !showBcc) && (
              <div
                style={{
                  padding: "4px 12px",
                  borderBottom: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
                }}
              >
                <Space size={8}>
                  {!showCc && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setShowCc(true)}
                      style={{ padding: 0, height: "auto", fontSize: 12 }}
                    >
                      Cc
                    </Button>
                  )}
                  {!showBcc && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setShowBcc(true)}
                      style={{ padding: 0, height: "auto", fontSize: 12 }}
                    >
                      Bcc
                    </Button>
                  )}
                </Space>
              </div>
            )}

            {/* Subject */}
            <div
              style={{
                padding: "8px 12px",
                borderBottom: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
              }}
            >
              <Input
                placeholder="Subject"
                bordered={false}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ padding: 0, background: "transparent" }}
              />
            </div>

            {/* Body */}
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <TextArea
                placeholder="Compose email..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                bordered={false}
                autoSize={{ minRows: 8 }}
                style={{
                  flex: 1,
                  resize: "none",
                  padding: "12px",
                  background: "transparent",
                }}
              />
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "8px 12px",
                borderTop: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Space>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={sendEmailMutation.isPending}
                  style={{ backgroundColor: primaryColor }}
                >
                  Send
                </Button>
                <Button
                  icon={<PaperClipOutlined />}
                  onClick={() => message.info("Attachment feature coming soon")}
                >
                  Attach
                </Button>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleClose}
                >
                  Discard
                </Button>
              </Space>
            </div>
          </div>
        </div>
      )}

      {/* Resize handle */}
      {!isMinimized && !isMaximized && (
        <div
          onMouseDown={handleResizeStart}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 20,
            height: 20,
            cursor: "nwse-resize",
            background: `linear-gradient(135deg, transparent 0%, transparent 40%, ${isDark ? "#303030" : "#e8e8e8"} 40%, ${isDark ? "#303030" : "#e8e8e8"} 60%, transparent 60%)`,
          }}
        />
      )}
    </div>
  );
};

export default ComposeModal;
