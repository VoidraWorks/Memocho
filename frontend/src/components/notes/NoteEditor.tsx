import React, { useEffect, useRef, useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Heading from "@tiptap/extension-heading";
import CodeBlock from "@tiptap/extension-code-block";
import {
  Bold, Italic, Code2, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Minus, Cloud, CloudOff,
  Pin, Trash2,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { Tooltip } from "../ui/Tooltip";
import type { Note } from "../../types";

interface NoteEditorProps {
  note: Note;
  isSaving: boolean;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
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
    [delay] // stable — delay never changes
  );
}

const ToolbarBtn: React.FC<{
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}> = ({ active, onClick, title, children, danger }) => (
  <Tooltip content={title}>
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cn(
        "w-6 h-6 flex items-center justify-center rounded-md transition-all duration-100",
        danger
          ? "text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500"
          : active
          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
          : "text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-700 dark:hover:text-surface-200"
      )}
    >
      {children}
    </button>
  </Tooltip>
);

const Divider = () => (
  <div className="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-0.5 flex-shrink-0" />
);

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
}

function wordCount(content: string): number {
  if (!content) return 0;
  try {
    const doc = JSON.parse(content) as { content?: unknown[] };
    const texts: string[] = [];
    function walk(node: { text?: string; content?: unknown[] }) {
      if (node.text) texts.push(node.text);
      if (node.content) (node.content as typeof node[]).forEach(walk);
    }
    walk(doc as { text?: string; content?: unknown[] });
    return texts.join(" ").split(/\s+/).filter(Boolean).length;
  } catch {
    return content.split(/\s+/).filter(Boolean).length;
  }
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  isSaving,
  onUpdateTitle,
  onUpdateContent,
  onTogglePin,
  onDelete,
}) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const [charCount, setCharCount] = useState(0);

  const debouncedContentUpdate = useDebounce((content: string) => {
    onUpdateContent(content);
  }, 600);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: false, codeBlock: false }),
        Heading.configure({ levels: [1, 2, 3] }),
        CodeBlock,
        Placeholder.configure({ placeholder: "Start writing your thoughts…" }),
        TaskList,
        TaskItem.configure({ nested: true }),
      ],
      content: note.content ? (() => {
        try { return JSON.parse(note.content); } catch { return note.content; }
      })() : "",
      editorProps: {
        attributes: {
          class: "outline-none min-h-[300px] prose prose-sm dark:prose-invert max-w-none text-surface-800 dark:text-surface-200",
        },
      },
      onUpdate: ({ editor }) => {
        const json = JSON.stringify(editor.getJSON());
        debouncedContentUpdate(json);
        setCharCount(editor.getText().length);
      },
    },
    [note.id]
  );

  // Sync content when note changes (switching notes)
  useEffect(() => {
    if (!editor) return;
    const content = note.content
      ? (() => { try { return JSON.parse(note.content); } catch { return note.content; } })()
      : "";
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content);
      setCharCount(editor.getText().length);
    }
  }, [note.id, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  const words = wordCount(note.content);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface-0 dark:bg-surface-900">
      {/* Top metadata bar */}
      <div className="flex items-center gap-2 px-6 pt-4 pb-1 flex-shrink-0">
        <span className="text-[11px] text-surface-400 dark:text-surface-600">
          {formatFullDate(note.updatedAt)}
        </span>
        <span className="text-surface-200 dark:text-surface-700">·</span>
        <span className="text-[11px] text-surface-400 dark:text-surface-600">
          {words} {words === 1 ? "word" : "words"}
        </span>
        <div className="flex-1" />
        {/* Save status */}
        {isSaving ? (
          <div className="flex items-center gap-1.5 text-[11px] text-surface-400 dark:text-surface-600 animate-pulse">
            <Cloud size={11} />
            Saving…
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-surface-300 dark:text-surface-700">
            <CloudOff size={11} />
            Saved locally
          </div>
        )}
        {/* Note actions */}
        <button
          onClick={() => onTogglePin(note.id)}
          className={cn(
            "ml-2 w-6 h-6 flex items-center justify-center rounded-md transition-all",
            note.pinned
              ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              : "text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-600 dark:hover:text-surface-300"
          )}
          title={note.pinned ? "Unpin note" : "Pin note"}
        >
          <Pin size={12} className={note.pinned ? "fill-amber-500" : ""} />
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="w-6 h-6 flex items-center justify-center rounded-md text-surface-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 transition-all"
          title="Delete note"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Title */}
      <div className="px-6 pt-3 pb-2 flex-shrink-0">
        <input
          ref={titleRef}
          defaultValue={note.title}
          key={note.id}
          placeholder="Untitled"
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (val !== note.title) onUpdateTitle(val || "Untitled");
          }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); editor.commands.focus(); } }}
          className="w-full text-2xl font-bold bg-transparent text-surface-900 dark:text-surface-50 placeholder:text-surface-200 dark:placeholder:text-surface-700 focus:outline-none leading-tight tracking-tight"
        />
      </div>

      {/* Tags row */}
      {note.tags.length > 0 && (
        <div className="flex items-center gap-1.5 px-6 pb-2 flex-shrink-0 flex-wrap">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/40 font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-5 py-1.5 border-y border-surface-100 dark:border-surface-800/50 flex-wrap flex-shrink-0 bg-surface-50/50 dark:bg-surface-850/50">
        <ToolbarBtn title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={12} />
        </ToolbarBtn>
        <ToolbarBtn title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={12} />
        </ToolbarBtn>
        <ToolbarBtn title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code2 size={12} />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={12} />
        </ToolbarBtn>
        <ToolbarBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={12} />
        </ToolbarBtn>
        <ToolbarBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={12} />
        </ToolbarBtn>
        <Divider />
        <ToolbarBtn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={12} />
        </ToolbarBtn>
        <ToolbarBtn title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={12} />
        </ToolbarBtn>
        <ToolbarBtn title="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <CheckSquare size={12} />
        </ToolbarBtn>
        <ToolbarBtn title="Divider line" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={12} />
        </ToolbarBtn>
        <div className="flex-1" />
        <span className="text-[10px] text-surface-300 dark:text-surface-700 tabular-nums">
          {charCount} chars
        </span>
      </div>

      {/* Editor area */}
      <div
        className="flex-1 overflow-y-auto px-6 py-5 cursor-text"
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
