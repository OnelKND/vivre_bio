import type { Metadata } from "next";
import Link from "next/link";
import ArticleForm from "@/components/admin/ArticleForm";

export const metadata: Metadata = {
  title: "Nouvel article — Espace VIVRE BIO",
  robots: { index: false },
};

export default function NewArticlePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <Link href="/admin/articles" className="text-sm link link-primary mb-6 inline-block">
        ← Retour aux articles
      </Link>
      <h1 className="font-bold text-2xl mb-8">Ajouter un article</h1>
      <ArticleForm />
    </div>
  );
}
