import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useTheme } from "@/hooks/useTheme";

export interface EmailEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}

const ToolbarDivider: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <span
    style={{
      width: 1,
      height: 20,
      background: isDark ? "#444" : "#ddd",
      margin: "0 4px",
      alignSelf: "center",
    }}
  />
);

const ToolbarButton: React.FC<{
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}> = ({ active, onClick, title, children, isDark }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className="email-editor-toolbar-btn"
    data-active={active}
    data-dark={isDark}
    style={{
      padding: "4px 8px",
      border: "none",
      background: active
        ? isDark
          ? "rgba(255,255,255,0.15)"
          : "rgba(0,0,0,0.08)"
        : "transparent",
      borderRadius: 4,
      cursor: "pointer",
      color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)",
    }}
  >
    {children}
  </button>
);

const HEADING_OPTIONS = [
  { value: "paragraph", label: "Paragraph", level: null },
  { value: "h1", label: "Heading 1", level: 1 },
  { value: "h2", label: "Heading 2", level: 2 },
  { value: "h3", label: "Heading 3", level: 3 },
] as const;

const TEXT_COLORS = [
  { name: "Default", value: "" },
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#c53030" },
  { name: "Blue", value: "#2b6cb0" },
  { name: "Green", value: "#276749" },
];

const ALIGNMENTS = [
  { value: "left", title: "Align left", label: "≡" },
  { value: "center", title: "Align center", label: "≡" },
  { value: "right", title: "Align right", label: "≡" },
  { value: "justify", title: "Justify", label: "≡" },
] as const;

export const EmailEditor: React.FC<EmailEditorProps> = ({
  value,
  onChange,
  placeholder = "Compose email...",
  minHeight = 120,
  className,
  style,
}) => {
  const { isDark } = useTheme();
  const lastEmittedRef = useRef<string>(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        blockquote: {},
        bulletList: {},
        orderedList: {},
        listItem: {},
        hardBreak: {},
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "email-editor-content",
        "data-dark": isDark ? "true" : "false",
        style: `min-height: ${minHeight}px; outline: none;`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEmittedRef.current = html;
      onChange(html);
    },
  });

  // Normalize value: if it looks like plain text (e.g. reply), wrap as HTML
  const valueToHtml = (v: string): string => {
    if (!v || !v.trim()) return "<p></p>";
    const t = v.trim();
    if (t.startsWith("<") && (t.includes("</") || t.endsWith(">"))) return v;
    return "<p>" + v.replace(/\n/g, "<br/>") + "</p>";
  };

  // Sync external value into editor (e.g. when opening reply)
  useEffect(() => {
    if (!editor) return;
    const normalizedValue = valueToHtml(value);
    const currentHtml = editor.getHTML();
    if (normalizedValue !== currentHtml && value !== lastEmittedRef.current) {
      editor.commands.setContent(normalizedValue, false);
      lastEmittedRef.current = normalizedValue;
    }
  }, [editor, value]);

  // Update placeholder/theme when isDark changes
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: "email-editor-content",
          "data-dark": isDark ? "true" : "false",
          style: `min-height: ${minHeight}px; outline: none;`,
        },
      },
    });
  }, [editor, isDark, minHeight]);

  const handleLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      try {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
      } catch {
        editor.chain().focus().unsetLink().run();
      }
      return;
    }
    const href = url.trim().startsWith("http")
      ? url.trim()
      : `https://${url.trim()}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  if (!editor) return null;

  const currentHeadingLevel = editor.getAttributes("heading").level;
  const headingValue =
    currentHeadingLevel != null ? String(currentHeadingLevel) : "paragraph";
  const currentAlign =
    editor.getAttributes("paragraph").textAlign ||
    editor.getAttributes("heading").textAlign ||
    "left";

  return (
    <div
      className={className}
      data-dark={isDark ? "true" : "false"}
      style={{
        border: "none",
        borderRadius: 0,
        background: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        className="email-editor-toolbar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          padding: "6px 8px",
          // borderBottom: `1px solid ${isDark ? "#303030" : "#e8e8e8"}`,
          background: isDark ? "rgba(0,0,0,0.2)" : "#ffffff",
        }}
      >
        {/* Undo / Redo */}
        <ToolbarButton
          isDark={!!isDark}
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          isDark={!!isDark}
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↷
        </ToolbarButton>
        <ToolbarDivider isDark={!!isDark} />

        {/* Heading dropdown */}
        <select
          title="Text style"
          value={headingValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "paragraph") editor.chain().focus().setParagraph().run();
            else
              editor
                .chain()
                .focus()
                .toggleHeading({ level: Number(v) as 1 | 2 | 3 })
                .run();
          }}
          style={{
            padding: "4px 8px",
            borderRadius: 4,
            border: `1px solid ${isDark ? "#444" : "#ddd"}`,
            background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
            color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {HEADING_OPTIONS.map((o) => (
            <option key={o.value} value={o.level ?? "paragraph"}>
              {o.label}
            </option>
          ))}
        </select>
        <ToolbarDivider isDark={!!isDark} />

        {/* Lists */}
        <ToolbarButton
          isDark={!!isDark}
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • list
        </ToolbarButton>
        <ToolbarButton
          isDark={!!isDark}
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. list
        </ToolbarButton>
        <ToolbarButton
          isDark={!!isDark}
          title="Task list"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          ☑ list
        </ToolbarButton>
        <ToolbarDivider isDark={!!isDark} />

        {/* Text formatting */}
        <ToolbarButton
          isDark={!!isDark}
          title="Bold (⌘+B)"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          isDark={!!isDark}
          title="Italic (⌘+I)"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          isDark={!!isDark}
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          isDark={!!isDark}
          title="Underline (⌘+U)"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          isDark={!!isDark}
          title="Code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          &lt;/&gt;
        </ToolbarButton>
        <ToolbarDivider isDark={!!isDark} />

        {/* Text color */}
        <select
          title="Text color"
          value={editor.getAttributes("textStyle").color ?? ""}
          onChange={(e) => {
            const color = e.target.value;
            if (color) editor.chain().focus().setColor(color).run();
            else editor.chain().focus().unsetColor().run();
          }}
          style={{
            padding: "2px 6px",
            borderRadius: 4,
            border: `1px solid ${isDark ? "#444" : "#ddd"}`,
            background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
            color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)",
            cursor: "pointer",
            fontSize: 12,
            minWidth: 28,
          }}
        >
          {TEXT_COLORS.map((c) => (
            <option key={c.value || "default"} value={c.value}>
              {c.name}
            </option>
          ))}
        </select>
        <ToolbarButton
          isDark={!!isDark}
          title="Highlight"
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          🖍
        </ToolbarButton>
        <ToolbarDivider isDark={!!isDark} />

        {/* Link */}
        <ToolbarButton
          isDark={!!isDark}
          title="Insert link"
          active={editor.isActive("link")}
          onClick={handleLink}
        >
          🔗
        </ToolbarButton>
        <ToolbarDivider isDark={!!isDark} />

        {/* Alignment */}
        {ALIGNMENTS.map((a) => (
          <ToolbarButton
            key={a.value}
            isDark={!!isDark}
            title={a.title}
            active={currentAlign === a.value}
            onClick={() => editor.chain().focus().setTextAlign(a.value).run()}
          >
            <span
              style={{
                display: "inline-block",
                textAlign: a.value as "left" | "center" | "right" | "justify",
                width: 16,
              }}
            >
              ≡
            </span>
          </ToolbarButton>
        ))}
        <ToolbarDivider isDark={!!isDark} />

        <ToolbarButton
          isDark={!!isDark}
          title="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          "
        </ToolbarButton>
      </div>
      <div style={{ padding: "8px 12px" }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default EmailEditor;
