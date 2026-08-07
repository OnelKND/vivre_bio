import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/articles";
import ArticleForm from "@/components/admin/ArticleForm";

export const metadata: Metadata = {
  title: "Modifier l'article — Espace VIVRE BIO",
  robots: { index: false },
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = getArticleById(Number(id));
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <Link href="/admin/articles" className="text-sm link link-primary mb-6 inline-block">
        ← Retour aux articles
      </Link>
      <h1 className="font-bold text-2xl mb-8">Modifier « {article.title} »</h1>
      <ArticleForm article={article} />
    </div>
  );
}
