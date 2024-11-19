"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TiptapEditorProps {
  onChange: (html: string) => void;
  initialContent?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-border p-2 flex flex-wrap gap-1 items-center">
      <Button
        onClick={() => editor.chain().focus().toggleBold().run()}
        variant={editor.isActive("bold") ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        variant={editor.isActive("italic") ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        variant={editor.isActive("underline") ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-4 bg-border mx-1" />

      <Button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
};

const TiptapEditor = ({ onChange, initialContent = "" }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  return (
    <Card className="min-h-[150px]">
      <MenuBar editor={editor} />
      <CardContent className="p-0">
        <EditorContent
          editor={editor}
          className="focus:outline-none prose dark:prose-invert max-w-none p-3"
        />
      </CardContent>
    </Card>
  );
};

export default TiptapEditor;
