"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ContextForm } from "./ContextForm";
import { OutputPanel } from "./OutputPanel";
import { TypeSelector } from "./TypeSelector";
import type { AIContentType } from "@/lib/schemas";

export function AiToolsClient() {
  const [selectedType, setSelectedType] =
    useState<AIContentType>("renewal_message");
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  function handleSelectType(t: AIContentType) {
    setSelectedType(t);
    setContent(null);
    setGeneratedAt(null);
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-[280px]">
        <TypeSelector selectedType={selectedType} onSelect={handleSelectType} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <ContextForm
          key={selectedType}
          selectedType={selectedType}
          isGenerating={isGenerating}
          onBusyChange={(busy) => {
            setIsGenerating(busy);
            if (busy) {
              setContent(null);
              setGeneratedAt(null);
            }
          }}
          onSuccess={({ content: c, generatedAt: at }) => {
            setContent(c);
            setGeneratedAt(at);
          }}
          onError={(msg) => {
            toast.error(msg);
          }}
        />
        <OutputPanel
          content={content}
          isGenerating={isGenerating}
          generatedAt={generatedAt}
        />
      </div>
    </div>
  );
}
