"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

interface RichTextEditorProps {
  name: string;
  defaultValue?: string;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  icon,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-xs ${active ? "btn-primary" : "btn-ghost"}`}
    >
      <i className={icon} aria-hidden="true" />
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL du lien :", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border border-base-300 border-b-0 rounded-t-field bg-base-200/40 p-1.5">
      <ToolbarButton
        label="Gras"
        icon="fa-solid fa-bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italique"
        icon="fa-solid fa-italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Barré"
        icon="fa-solid fa-strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <span className="w-px h-4 bg-base-300 mx-1" aria-hidden="true" />
      <ToolbarButton
        label="Titre 2"
        icon="fa-solid fa-heading"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="Titre 3"
        icon="fa-solid fa-heading fa-xs"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <span className="w-px h-4 bg-base-300 mx-1" aria-hidden="true" />
      <ToolbarButton
        label="Liste à puces"
        icon="fa-solid fa-list-ul"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Liste numérotée"
        icon="fa-solid fa-list-ol"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="Citation"
        icon="fa-solid fa-quote-left"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="Lien"
        icon="fa-solid fa-link"
        active={editor.isActive("link")}
        onClick={setLink}
      />
    </div>
  );
}

/**
 * Éditeur riche minimal (gras/italique/titres/listes/citation/lien) — le
 * HTML produit est répercuté dans un input caché à chaque changement, pour
 * rester un simple champ du formulaire natif (pas de soumission via fetch).
 * Le contenu est de toute façon assaini côté serveur avant stockage (voir
 * app/admin/articles/actions.ts), donc aucune confiance n'est accordée à ce
 * HTML côté client.
 */
export default function RichTextEditor({ name, defaultValue = "" }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: defaultValue,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "article-content min-h-[240px] px-3 py-2 focus:outline-none",
      },
    },
  });

  if (!editor) {
    return (
      <div className="rounded-field border border-base-300 min-h-[280px] bg-base-200/40 animate-pulse" />
    );
  }

  return (
    <div>
      <Toolbar editor={editor} />
      <div className="rounded-b-field border border-base-300">
        <EditorContent editor={editor} />
      </div>
      <input type="hidden" name={name} value={editor.getHTML()} readOnly />
    </div>
  );
}
