import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAllBlogSlugs, getBlogPostBySlug } from "@/lib/blog-posts";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return { title: "Post not found" };
  }
  return {
    title: `${post.title} — Zentro blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      url: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const paragraphs = post.content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <main className="px-4 py-16 sm:px-6 md:py-24">
      <article className="mx-auto max-w-3xl">
        <nav className="text-sm text-slate-400">
          <Link href="/blog" className="font-medium text-brand-400 hover:text-brand-300">
            ← Blog
          </Link>
        </nav>
        <header className="mt-8 border-b border-white/10 pb-8">
          <p className="text-sm font-medium text-brand-400">{post.readTime}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-white sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-slate-400">
            {post.date} · {post.author}
          </p>
        </header>
        <div className="mt-10 max-w-none">
          {paragraphs.map((p, i) => (
            <p key={i} className="mb-6 text-base leading-[1.7] text-slate-300">
              {p}
            </p>
          ))}
        </div>
      </article>
    </main>
  );
}
