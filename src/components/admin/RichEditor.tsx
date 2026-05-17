import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo, Code,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export function RichEditor({ value, onChange, placeholder }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "underline text-primary" } }),
      Image,
      Placeholder.configure({ placeholder: placeholder ?? "Write content…" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[280px] focus:outline-none p-4",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return <div className="min-h-[300px] rounded-md border bg-white" />;

  const Btn = ({
    on, active, children, label,
  }: { on: () => void; active?: boolean; children: React.ReactNode; label: string }) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={on}
      className={`flex h-8 w-8 items-center justify-center rounded hover:bg-muted ${
        active ? "bg-muted text-primary" : "text-foreground"
      }`}
    >
      {children}
    </button>
  );

  const onPickImage = () => fileInput.current?.click();

  const uploadImage = async (file: File) => {
    const path = `editor/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("images").upload(path, file, {
      cacheControl: "3600", upsert: false,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("images").getPublicUrl(path);
    editor.chain().focus().setImage({ src: data.publicUrl }).run();
  };

  return (
    <div className="overflow-hidden rounded-md border bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/50 px-2 py-1">
        <Btn label="Bold" on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold size={15} /></Btn>
        <Btn label="Italic" on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn label="H2" on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><Heading2 size={15} /></Btn>
        <Btn label="H3" on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}><Heading3 size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn label="Bulleted list" on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}><List size={15} /></Btn>
        <Btn label="Numbered list" on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}><ListOrdered size={15} /></Btn>
        <Btn label="Quote" on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}><Quote size={15} /></Btn>
        <Btn label="Code" on={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}><Code size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn label="Link" on={() => {
          const url = window.prompt("URL", editor.getAttributes("link").href ?? "https://");
          if (url === null) return;
          if (url === "") editor.chain().focus().unsetLink().run();
          else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }} active={editor.isActive("link")}><LinkIcon size={15} /></Btn>
        <Btn label="Image" on={onPickImage}><ImageIcon size={15} /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn label="Undo" on={() => editor.chain().focus().undo().run()}><Undo size={15} /></Btn>
        <Btn label="Redo" on={() => editor.chain().focus().redo().run()}><Redo size={15} /></Btn>
      </div>
      <EditorContent editor={editor} />
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadImage(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
