import React, { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Heading from "@tiptap/extension-heading";
import CodeBlock from "@tiptap/extension-code-block";
import {
  Bold, Italic, Code2, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Minus, Loader2,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import type { Note } from "../../types";

interface NoteEditorProps {
  note: Note;
  isSaving: boolean;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: string) => void;
}

// Debounce helper
function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

const ToolbarButton: React.FC<{
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ active, onClick, title, children }) => (
  <Tooltip content={title}>
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "h-6 w-6",
        active && "bg-surface-100 dark:bg-surface-700 text-primary-600 dark:text-primary-400"
      )}
    >
      {children}
    </Button>
  </Tooltip>
);

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  isSaving,
  onUpdateTitle,
  onUpdateContent,
}) => {
  const titleRef = useRef<HTMLInputElement>(null);

  const debouncedContentUpdate = useDebounce((content: string) => {
    onUpdateContent(content);
  }, 600);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ heading: false, codeBlock: false }),
        Heading.configure({ levels: [1, 2, 3] }),
        CodeBlock,
        Placeholder.configure({ placeholder: "Start writing…" }),
        TaskList,
        TaskItem.configure({ nested: true }),
      ],
      content: note.content ? (() => {
        try { return JSON.parse(note.content); } catch { return note.content; }
      })() : "",
      editorProps: {
        attributes: {
          class: "outline-none min-h-[200px] prose prose-sm dark:prose-invert max-w-none text-surface-800 dark:text-surface-200",
        },
      },
      onUpdate: ({ editor }) => {
        debouncedContentUpdate(JSON.stringify(editor.getJSON()));
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
    }
  }, [note.id, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Title */}
      <div className="px-6 pt-6 pb-2">
        <input
          ref={titleRef}
          defaultValue={note.title}
          key={note.id}
          placeholder="Untitled"
          onBlur={(e) => {
            const val = e.target.value.trim();
            if (val !== note.title) onUpdateTitle(val || "Untitled");
          }}
          onKeyDown={(e) => { if (e.key === "Enter") editor.commands.focus(); }}
          className="w-full text-xl font-semibold bg-transparent text-surface-900 dark:text-surface-100 placeholder:text-surface-300 dark:placeholder:text-surface-700 focus:outline-none"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-5 py-1 border-b border-surface-100 dark:border-surface-800/50 flex-wrap">
        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={12} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={12} />
        </ToolbarButton>
        <ToolbarButton title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code2 size={12} />
        </ToolbarButton>
        <div className="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-0.5" />
        <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={12} />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={12} />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={12} />
        </ToolbarButton>
        <div className="w-px h-4 bg-surface-200 dark:bg-surface-700 mx-0.5" />
        <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={12} />
        </ToolbarButton>
        <ToolbarButton title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={12} />
        </ToolbarButton>
        <ToolbarButton title="Checklist" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <CheckSquare size={12} />
        </ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={12} />
        </ToolbarButton>
        <div className="flex-1" />
        {isSaving && (
          <div className="flex items-center gap-1 text-xs text-surface-400 dark:text-surface-600">
            <Loader2 size={10} className="animate-spin" />
            Saving…
          </div>
        )}
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
