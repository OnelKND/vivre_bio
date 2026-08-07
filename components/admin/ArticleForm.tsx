"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import Image from "next/image";
import type { Article } from "@/lib/articles";
import {
  createArticleAction,
  updateArticleAction,
  type ArticleFormState,
} from "@/app/admin/articles/actions";
import RichTextEditor from "./RichTextEditor";

const initialState: ArticleFormState = { status: "idle" };

interface ArticleFormProps {
  article?: Article;
}

export default function ArticleForm({ article }: ArticleFormProps) {
  const action = article ? updateArticleAction : createArticleAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewSrc(objectUrl);
    }
  };

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-2xl">
      {article && <input type="hidden" name="id" value={article.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="font-medium text-sm">
          Titre
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={article?.title}
          className="input border border-base-300 w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="excerpt" className="font-medium text-sm">
          Extrait
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          required
          rows={2}
          defaultValue={article?.excerpt}
          className="textarea border border-base-300 w-full"
        />
        <p className="text-xs text-base-content/50">
          Résumé affiché sur la liste des articles et dans les aperçus de partage.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">Contenu</span>
        <RichTextEditor name="content" defaultValue={article?.content} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="font-medium text-sm">
          Statut
        </label>
        <select
          id="status"
          name="status"
          required
          defaultValue={article?.status ?? "brouillon"}
          className="select border border-base-300 w-full max-w-xs"
        >
          <option value="brouillon">Brouillon</option>
          <option value="publie">Publié</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="coverImage" className="font-medium text-sm">
          Image de couverture{" "}
          {article ? "(laisser vide pour garder l'actuelle)" : "(facultative)"}
        </label>
        {(previewSrc || article) && (
          <div className="w-32 h-24 relative rounded-box overflow-hidden bg-base-200 mb-1">
            <Image
              src={previewSrc ?? article!.coverImage}
              alt="Aperçu de la couverture"
              fill
              className="object-cover"
            />
          </div>
        )}
        <input
          id="coverImage"
          name="coverImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="file-input border border-base-300 w-full"
          onChange={handleCoverChange}
        />
        <p className="text-xs text-base-content/50">
          JPG, PNG ou WEBP, 5 Mo maximum.{" "}
          {!article && "Sans photo, un visuel provisoire avec l'initiale du titre sera utilisé."}
        </p>
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-accent text-sm">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary self-start">
        {pending ? "Enregistrement..." : article ? "Mettre à jour" : "Créer l'article"}
      </button>
    </form>
  );
}
