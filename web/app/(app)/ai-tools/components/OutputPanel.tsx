"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/zims/loading-spinner";
import { cn } from "@/lib/utils";

export function OutputPanel({
  content,
  isGenerating,
  generatedAt,
}: {
  content: string | null;
  isGenerating: boolean;
  generatedAt: string | null;
}) {
  const router = useRouter();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = taRef.current;
    if (!el || !content) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(120, el.scrollHeight)}px`;
  }, [content]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function handleCopy() {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function handleWhatsApp() {
    if (!content) return;
    router.push(`/interactions?message=${encodeURIComponent(content)}`);
  }

  if (isGenerating) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-border bg-card p-5">
        <LoadingSpinner className="min-h-0 py-4" label="Generating" />
        <p className="mt-2 text-sm text-muted-foreground">Generating content…</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-border bg-card p-5 text-center">
        <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        <p className="mt-3 text-sm font-medium text-foreground">
          Your generated content will appear here
        </p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Select a content type and fill in the details, then click Generate
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[200px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <textarea
        ref={taRef}
        readOnly
        value={content}
        className={cn(
          "w-full min-h-[120px] resize-none rounded-xl border-l-4 border-l-brand-300 bg-slate-50 p-4 text-[13px] leading-[1.8] text-slate-800 outline-none focus:outline-none",
          "min-h-[120px]",
        )}
        aria-label="Generated content"
      />
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg border-brand-200 bg-brand-50 text-[11px] text-brand-600"
          onClick={() => void handleCopy()}
        >
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-lg border border-green-200 bg-green-50 text-[11px] text-green-700 hover:bg-green-100"
          onClick={handleWhatsApp}
        >
          Send via WhatsApp
        </Button>
      </div>
      {generatedAt ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Generated at{" "}
          {new Date(generatedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      ) : null}
    </div>
  );
}
