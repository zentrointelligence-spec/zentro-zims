"use client"

import { motion } from "framer-motion"
import {
  Phone,
  Mail,
  StickyNote,
  Globe,
  Share2,
  User,
  Calendar,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn, formatDate } from "@/lib/utils"
import type { Lead } from "@/lib/schemas"

const STATUS_BORDER: Record<string, string> = {
  new: "border-l-blue-500",
  contacted: "border-l-amber-500",
  qualified: "border-l-purple-500",
  proposal_sent: "border-l-indigo-500",
  converted: "border-l-emerald-500",
  lost: "border-l-slate-500",
}

const SOURCE_ICON: Record<string, React.ReactNode> = {
  web: <Globe className="h-3 w-3" />,
  referral: <Share2 className="h-3 w-3" />,
  walk_in: <User className="h-3 w-3" />,
}

export function LeadCard({
  lead,
  onClick,
}: {
  lead: Lead
  onClick?: () => void
}) {
  const borderColor = STATUS_BORDER[lead.status] ?? "border-l-slate-300"
  const sourceIcon = lead.source
    ? (SOURCE_ICON[lead.source] ?? <Globe className="h-3 w-3" />)
    : null

  return (
    <motion.div
      className={cn(
        "group relative cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm",
        "border-l-4 transition-shadow hover:shadow-md",
        borderColor,
      )}
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{lead.name}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{lead.phone}</p>
        </div>
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0, x: 8 }}
          whileHover={{ opacity: 1, x: 0 }}
        >
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = `tel:${lead.phone}`
              }}
              title="Call"
            >
              <Phone className="h-3 w-3" />
            </button>
            {lead.email ? (
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = `mailto:${lead.email}`
                }}
                title="Email"
              >
                <Mail className="h-3 w-3" />
              </button>
            ) : null}
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600"
              onClick={(e) => e.stopPropagation()}
              title="Note"
            >
              <StickyNote className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px] capitalize">
          {lead.insurance_type}
        </Badge>
        {lead.source ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
            {sourceIcon}
            {lead.source}
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-[9px] font-bold text-brand-600">
            {initials(lead.name)}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Agent</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
          <Calendar className="h-3 w-3" />
          {formatDate(lead.created_at)}
        </span>
      </div>
    </motion.div>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "??"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}
