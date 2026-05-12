"use client"

import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@/lib/motion-config"
import { LeadCard } from "./LeadCard"
import type { Lead } from "@/lib/schemas"

export type KanbanStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "converted"
  | "lost"

const COLUMNS: { key: KanbanStatus; label: string; color: string; border: string }[] = [
  { key: "new", label: "New", color: "text-blue-600", border: "border-t-blue-500" },
  { key: "contacted", label: "Contacted", color: "text-amber-600", border: "border-t-amber-500" },
  { key: "qualified", label: "Qualified", color: "text-purple-600", border: "border-t-purple-500" },
  { key: "proposal_sent", label: "Proposal Sent", color: "text-indigo-600", border: "border-t-indigo-500" },
  { key: "converted", label: "Converted", color: "text-emerald-600", border: "border-t-emerald-500" },
  { key: "lost", label: "Lost", color: "text-slate-600 dark:text-slate-300", border: "border-t-slate-500" },
]

export function LeadKanban({
  leadsByStatus,
  onCardClick,
}: {
  leadsByStatus: Record<KanbanStatus, Lead[]>
  onCardClick?: (lead: Lead) => void
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {COLUMNS.map((col) => {
        const leads = leadsByStatus[col.key] ?? []
        return (
          <div
            key={col.key}
            className="flex w-[280px] shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50/50"
          >
            <div
              className={`flex items-center justify-between border-t-4 ${col.border} rounded-t-xl px-4 py-3`}
            >
              <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white dark:bg-card px-2 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                {leads.length}
              </span>
            </div>
            <motion.div
              className="flex flex-col gap-2 p-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {leads.map((lead) => (
                <motion.div key={lead.id} variants={staggerItem as any}>
                  <LeadCard lead={lead} onClick={() => onCardClick?.(lead)} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
