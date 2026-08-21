import React, { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Heading from "@tiptap/extension-heading";
import CodeBlock from "@tiptap/extension-code-block";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit, listen } from "@tauri-apps/api/event";
import { X, Palette } from "lucide-react";
import { cn } from "../../lib/cn";
import { storage } from "../../services/storage";
import type { Note, StickyColor } from "../../types";

const STICKY_COLORS: Record<StickyColor, { bg: string; border: string; text: string; titleBar: string }> = {
  yellow: { bg: "#FEF3C7", border: "#F59E0B", text: "#78350F", titleBar: "#FDE68A" },
  rose:   { bg: "#FFE4E6", border: "#F43F5E", text: "#881337", titleBar: "#FECDD3" },
  sky:    { bg: "#E0F2FE", border: "#0EA5E9", text: "#0C4A6E", titleBar: "#BAE6FD" },
  emerald:{ bg: "#D1FAE5", border: "#10B981", text: "#064E3B", titleBar: "#A7F3D0" },
  violet: { bg: "#EDE9FE", border: "#8B5CF6", text: "#4C1D95", titleBar: "#DDD6FE" },
  amber:  { bg: "#FEF3C7", border: "#D97706", text: "#78350F", titleBar: "#FDE68A" },
};

const COLOR_OPTIONS: StickyColor[] = ["yellow", "rose", "sky", "emerald", "violet", "amber"];

function hashColor(id: string): StickyColor {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return COLOR_OPTIONS[Math.abs(hash) % COLOR_OPTIONS.length]!;
}

function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay]
  );
}

export const StickyNoteWindow: React.FC = () => {
  const [note, setNote] = useState<Note | null>(null);
  const [color, setColor] = useState<StickyColor>("yellow");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Load note from localStorage on mount
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    const notes = storage.get<Note[]>("notes", []);
    const found = notes.find((n) => n.id === hash);
    if (found) {
      setNote(found);
      setColor(found.color ?? hashColor(found.id));
    }
  }, []);

  // Listen for note-update events from other windows
  useEffect(() => {
    const unlisten = listen<{ noteId: string; note: Note }>("note-updated", (event) => {
      if (event.payload.noteId === note?.id) {
        setNote(event.payload.note);
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [note?.id]);

  // Listen for note-deleted events to close this window
  useEffect(() => {
    const unlisten = listen<{ noteId: string }>("note-deleted", (event) => {
      if (event.payload.noteId === note?.id) {
        getCurrentWebviewWindow().close();
      }
    });
    return () => { unlisten.then((fn) => fn()); };
  }, [note?.id]);

  // Close color picker on click outside
  useEffect(() => {
    if (!showColorPicker) return;
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColorPicker]);

  const saveToStorage = useCallback((updated: Note) => {
    const notes = storage.get<Note[]>("notes", []);
    const idx = notes.findIndex((n) => n.id === updated.id);
    if (idx !== -1) {
      notes[idx] = updated;
      storage.set("notes", notes);
    }
    // Broadcast update to other windows
    emit("note-updated", { noteId: updated.id, note: updated });
  }, []);

  const handleTitleChange = useCallback((title: string) => {
    if (!note) return;
    const updated = { ...note, title, updatedAt: new Date().toISOString() };
    setNote(updated);
    saveToStorage(updated);
  }, [note, saveToStorage]);

  const handleContentChange = useCallback((content: string) => {
    if (!note) return;
    const preview = extractPlainText(content).slice(0, 160);
    const updated = { ...note, content, preview, updatedAt: new Date().toISOString() };
    setNote(updated);
    saveToStorage(updated);
  }, [note, saveToStorage]);

  const handleColorChange = useCallback((newColor: StickyColor) => {
    if (!note) return;
    setColor(newColor);
    const updated = { ...note, color: newColor, updatedAt: new Date().toISOString() };
    setNote(updated);
    saveToStorage(updated);
    setShowColorPicker(false);
  }, [note, saveToStorage]);

  const handleClose = useCallback(() => {
    getCurrentWebviewWindow().close();
  }, []);

  // Start native drag from title bar
  const handleDragStart = useCallback(async () => {
    try {
      const win = getCurrentWebviewWindow();
      await win.startDragging();
    } catch (e) {
      console.error("Drag failed:", e);
    }
  }, []);

  if (!note) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-yellow-50">
        <span className="text-sm text-amber-700">Loading note…</span>
      </div>
    );
  }

  const theme = STICKY_COLORS[color];

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden rounded-xl shadow-lg"
      style={{
        backgroundColor: theme.bg,
        border: `1px solid ${theme.border}40`,
      }}
    >
      {/* Title bar / drag handle */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 flex-shrink-0 select-none"
        style={{ backgroundColor: theme.titleBar }}
        onMouseDown={(e) => {
          e.preventDefault();
          handleDragStart();
        }}
      >
        <div className="flex-1" />

        {/* Color picker */}
        <div className="relative" ref={colorPickerRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowColorPicker((o) => !o); }}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-5 h-5 flex items-center justify-center rounded-md transition-colors"
            style={{ color: theme.text, opacity: 0.6 }}
            title="Change color"
          >
            <Palette size={11} />
          </button>
          {showColorPicker && (
            <div
              className="absolute right-0 top-6 z-50 p-1.5 rounded-lg shadow-lg flex gap-1"
              style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}30` }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                    color === c ? "scale-110" : ""
                  )}
                  style={{
                    backgroundColor: STICKY_COLORS[c].bg,
                    borderColor: color === c ? STICKY_COLORS[c].border : "transparent",
                  }}
                  title={c}
                />
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-5 h-5 flex items-center justify-center rounded-md transition-colors"
          style={{ color: theme.text, opacity: 0.6 }}
          title="Close"
        >
          <X size={11} />
        </button>
      </div>

      {/* Editor area */}
      <StickyEditor
        note={note}
        theme={theme}
        onTitleChange={handleTitleChange}
        onContentChange={handleContentChange}
      />
    </div>
  );
};

// ─── Minimal editor for sticky notes ──────────────────────────────────────────

interface StickyEditorProps {
  note: Note;
  theme: { bg: string; border: string; text: string; titleBar: string };
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
}

const StickyEditor: React.FC<StickyEditorProps> = ({
  note,
  theme,
  onTitleChange,
  onContentChange,
}) => {
  const titleRef = useRef<HTMLInputElement>(null);

  const debouncedContentUpdate = useDebounce((content: string) => {
    onContentChange(content);
  }, 500);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: false, codeBlock: false }),
        Heading.configure({ levels: [1, 2, 3] }),
        CodeBlock,
        Placeholder.configure({ placeholder: "Write something…" }),
        TaskList,
        TaskItem.configure({ nested: true }),
      ],
      content: note.content ? (() => {
        try { return JSON.parse(note.content); } catch { return note.content; }
      })() : "",
      editorProps: {
        attributes: {
          class: "outline-none min-h-[120px] text-sm leading-relaxed",
        },
      },
      onUpdate: ({ editor: e }) => {
        const json = JSON.stringify(e.getJSON());
        debouncedContentUpdate(json);
      },
    },
    [note.id]
  );

  // Sync content when note changes
  useEffect(() => {
    if (!editor) return;
    const content = note.content
      ? (() => { try { return JSON.parse(note.content); } catch { return note.content; } })()
      : "";
    const current = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(content);
    if (current !== next) {
      editor.commands.setContent(content);
    }
  }, [note.id, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Title */}
      <div className="px-3 pt-2 pb-1 flex-shrink-0">
        <input
          ref={titleRef}
          defaultValue={note.title}
          key={note.id}
          placeholder="Untitled"
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (val !== note.title) onTitleChange(val || "Untitled");
          }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); editor.commands.focus(); } }}
          className="w-full text-base font-bold bg-transparent placeholder:opacity-40 focus:outline-none leading-tight"
          style={{ color: theme.text }}
        />
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex items-center gap-1 px-3 pb-1 flex-shrink-0 flex-wrap">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${theme.border}20`,
                color: theme.text,
                opacity: 0.7,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Minimal toolbar */}
      <div
        className="flex items-center gap-0.5 px-2 py-1 flex-shrink-0 border-b"
        style={{ borderColor: `${theme.border}20` }}
      >
        <ToolbarBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          theme={theme}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          theme={theme}
          title="Italic"
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          theme={theme}
          title="Code"
        >
          <span className="text-[10px] font-mono">{"</>"}</span>
        </ToolbarBtn>
        <div className="w-px h-3 mx-0.5" style={{ backgroundColor: `${theme.border}30` }} />
        <ToolbarBtn
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          theme={theme}
          title="Heading"
        >
          <span className="text-[10px] font-bold">H</span>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          theme={theme}
          title="List"
        >
          <span className="text-[10px]">&#8226;</span>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          theme={theme}
          title="Checklist"
        >
          <span className="text-[10px]">&#9745;</span>
        </ToolbarBtn>
      </div>

      {/* Editor content */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 cursor-text sticky-editor"
        style={{ color: theme.text }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

// ─── Tiny toolbar button ──────────────────────────────────────────────────────

const ToolbarBtn: React.FC<{
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  theme: { bg: string; border: string; text: string };
}> = ({ active, onClick, title, children, theme }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className="w-5 h-5 flex items-center justify-center rounded transition-all duration-100"
    style={{
      backgroundColor: active ? `${theme.border}25` : "transparent",
      color: theme.text,
      opacity: active ? 1 : 0.5,
    }}
  >
    {children}
  </button>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractPlainText(jsonStr: string): string {
  try {
    const doc = JSON.parse(jsonStr);
    const texts: string[] = [];
    function walk(node: { text?: string; content?: unknown[] }) {
      if (node.text) texts.push(node.text);
      if (node.content) node.content.forEach(walk as (n: unknown) => void);
    }
    walk(doc);
    return texts.join(" ");
  } catch {
    return jsonStr;
  }
}
