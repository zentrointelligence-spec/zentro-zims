import type { Metadata } from "next";
import Link from "next/link";

import { getAllBlogPosts } from "@/lib/blog-posts";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Blog — Zentro",
  description:
    "Insights for insurance agencies on renewals, WhatsApp, data quality, and running a modern brokerage.",
  openGraph: {
    title: "Zentro blog — for modern insurance agencies",
    description:
      "Practical guides on spreadsheets, WhatsApp, renewals, and growing your agency.",
    type: "website",
    url: "/blog",
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <main className="px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-white md:text-4xl">
            Zentro blog
          </h1>
          <p className="mt-4 text-base leading-[1.7] text-slate-400">
            Practical ideas for agencies modernising how they sell, renew, and
            communicate.
          </p>
        </header>
        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <article className="flex h-full flex-col rounded-xl border border-white/10 bg-slate-900/30 p-6 shadow-sm transition-all hover:shadow-md hover:border-white/20">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-400">
                  {post.readTime}
                </p>
                <h2 className="mt-2 text-lg font-bold tracking-[-0.02em] text-white">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="transition-colors hover:text-brand-400"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {post.date} · {post.author}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">
                  {post.excerpt}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 text-sm font-semibold text-brand-400 hover:text-brand-300"
                >
                  Read article →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
