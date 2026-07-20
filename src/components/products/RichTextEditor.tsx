import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold, Heading2, Italic, List, ListOrdered, Pilcrow, Quote,
  Redo2, RemoveFormatting, Underline, Undo2,
} from 'lucide-react';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: 'min-h-56 p-4 text-sm font-medium leading-7 text-stone-800 outline-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  const buttonClass = (active = false) => (
    `inline-grid h-9 w-9 cursor-pointer place-items-center rounded-md border text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
      active
        ? 'border-emerald-700 bg-emerald-700 text-white'
        : 'border-stone-900/10 bg-white text-stone-600 hover:border-emerald-500 hover:text-emerald-800'
    }`
  );

  return (
    <div className="overflow-hidden rounded-lg border border-stone-900/10 bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
      <div className="flex flex-wrap gap-1.5 border-b border-stone-900/10 bg-stone-50 p-2" role="toolbar" aria-label="Product description formatting">
        <button type="button" className={buttonClass(editor?.isActive('paragraph'))} onClick={() => editor?.chain().focus().setParagraph().run()} disabled={!editor} title="Paragraph" aria-label="Paragraph"><Pilcrow size={17} /></button>
        <button type="button" className={buttonClass(editor?.isActive('heading', { level: 2 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} disabled={!editor} title="Heading" aria-label="Heading"><Heading2 size={17} /></button>
        <span className="mx-1 w-px bg-stone-200" aria-hidden="true" />
        <button type="button" className={buttonClass(editor?.isActive('bold'))} onClick={() => editor?.chain().focus().toggleBold().run()} disabled={!editor} title="Bold" aria-label="Bold"><Bold size={17} /></button>
        <button type="button" className={buttonClass(editor?.isActive('italic'))} onClick={() => editor?.chain().focus().toggleItalic().run()} disabled={!editor} title="Italic" aria-label="Italic"><Italic size={17} /></button>
        <button type="button" className={buttonClass(editor?.isActive('underline'))} onClick={() => editor?.chain().focus().toggleUnderline().run()} disabled={!editor} title="Underline" aria-label="Underline"><Underline size={17} /></button>
        <span className="mx-1 w-px bg-stone-200" aria-hidden="true" />
        <button type="button" className={buttonClass(editor?.isActive('bulletList'))} onClick={() => editor?.chain().focus().toggleBulletList().run()} disabled={!editor} title="Bullet list" aria-label="Bullet list"><List size={17} /></button>
        <button type="button" className={buttonClass(editor?.isActive('orderedList'))} onClick={() => editor?.chain().focus().toggleOrderedList().run()} disabled={!editor} title="Numbered list" aria-label="Numbered list"><ListOrdered size={17} /></button>
        <button type="button" className={buttonClass(editor?.isActive('blockquote'))} onClick={() => editor?.chain().focus().toggleBlockquote().run()} disabled={!editor} title="Quote" aria-label="Quote"><Quote size={17} /></button>
        <span className="mx-1 w-px bg-stone-200" aria-hidden="true" />
        <button type="button" className={buttonClass()} onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} disabled={!editor} title="Clear formatting" aria-label="Clear formatting"><RemoveFormatting size={17} /></button>
        <button type="button" className={buttonClass()} onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().chain().focus().undo().run()} title="Undo" aria-label="Undo"><Undo2 size={17} /></button>
        <button type="button" className={buttonClass()} onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().chain().focus().redo().run()} title="Redo" aria-label="Redo"><Redo2 size={17} /></button>
      </div>
      <EditorContent
        editor={editor}
        className="[&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-emerald-500/40 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_h2]:my-4 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-black [&_.ProseMirror_li]:my-1 [&_.ProseMirror_ol]:my-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p]:my-3 [&_.ProseMirror_ul]:my-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6"
      />
    </div>
  );
}
