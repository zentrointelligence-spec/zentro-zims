"use client";

import {
  FileText,
  Gift,
  Megaphone,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AIContentType } from "@/lib/schemas";

const ITEMS: {
  type: AIContentType;
  label: string;
  description: string;
  Icon: typeof Megaphone;
}[] = [
  {
    type: "marketing_post",
    label: "Marketing post",
    description:
      "Generate a social media post for WhatsApp, Facebook, or Instagram",
    Icon: Megaphone,
  },
  {
    type: "renewal_message",
    label: "Renewal reminder",
    description:
      "Personalised renewal reminder for a customer whose policy is due",
    Icon: RefreshCw,
  },
  {
    type: "birthday_wish",
    label: "Birthday wish",
    description: "Warm birthday message to send to a customer",
    Icon: Gift,
  },
  {
    type: "quote_summary",
    label: "Quote summary",
    description: "Clear WhatsApp summary of a quote to send to a prospect",
    Icon: FileText,
  },
  {
    type: "follow_up_message",
    label: "Follow-up message",
    description: "Friendly follow-up for a lead who showed interest",
    Icon: MessageCircle,
  },
];

export function TypeSelector({
  selectedType,
  onSelect,
}: {
  selectedType: AIContentType;
  onSelect: (t: AIContentType) => void;
}) {
  return (
    <div
      className="flex snap-x snap-mandatory flex-row gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-col md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Content type"
    >
      {ITEMS.map((item) => {
        const selected = selectedType === item.type;
        const Icon = item.Icon;
        return (
          <button
            key={item.type}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(item.type)}
            className={cn(
              "flex w-[min(260px,85vw)] shrink-0 snap-start cursor-pointer flex-col gap-1 rounded-md border bg-card p-3 text-left transition-colors md:w-full",
              "border-border hover:bg-muted/50",
              selected &&
                "border-2 border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/30",
              !selected && "border",
            )}
          >
            <div className="flex items-center gap-2">
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  selected ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  selected ? "text-indigo-900 dark:text-indigo-100" : "text-foreground",
                )}
              >
                {item.label}
              </span>
            </div>
            <p className="text-xs leading-snug text-muted-foreground">
              {item.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
