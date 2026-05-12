"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Phone,
  Mail,
  MessageCircle,
  UserPlus,
  Calendar,
  Tag,
  User,
  FileText,
  Clock,
  StickyNote,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { fadeInUp, slideInRight, scaleIn } from "@/lib/motion-config"
import { StatusChip } from "@/components/zims/status-chip"
import { cn, formatDate } from "@/lib/utils"
import type { Lead } from "@/lib/schemas"

const TABS = [
  { value: "overview", label: "Overview", icon: User },
  { value: "notes", label: "Notes", icon: StickyNote },
  { value: "activity", label: "Activity", icon: Clock },
  { value: "documents", label: "Documents", icon: FileText },
] as const

export function LeadDetailSlideOver({
  open,
  onClose,
  lead,
}: {
  open: boolean
  onClose: () => void
  lead: Lead | null
}) {
  const [activeTab, setActiveTab] = useState<string>("overview")

  if (!lead) return null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-[480px] sm:max-w-lg"
        showCloseButton={false}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex h-full flex-col"
        >
          {/* Header */}
          <SheetHeader className="shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SheetTitle className="truncate text-lg">{lead.name}</SheetTitle>
                <SheetDescription className="mt-1.5 flex items-center gap-2">
                  <StatusChip status={lead.status} kind="lead" />
                  <span className="text-xs text-muted-foreground">
                    ID #{lead.id}
                  </span>
                </SheetDescription>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </SheetHeader>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-4 flex flex-1 flex-col overflow-hidden"
          >
            <TabsList variant="line" className="shrink-0">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  <t.icon className="mr-1.5 h-3.5 w-3.5" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="relative mt-2 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={fadeInUp.initial}
                  animate={fadeInUp.animate}
                  exit={fadeInUp.exit}
                  transition={fadeInUp.transition}
                  className="space-y-4 p-1"
                >
                  {activeTab === "overview" && (
                    <OverviewTab lead={lead} />
                  )}
                  {activeTab === "notes" && (
                    <NotesTab lead={lead} />
                  )}
                  {activeTab === "activity" && (
                    <ActivityTab lead={lead} />
                  )}
                  {activeTab === "documents" && (
                    <DocumentsTab lead={lead} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>

          {/* Bottom action bar */}
          <div className="shrink-0 border-t bg-muted/30 p-4">
            <div className="flex flex-wrap gap-2">
              <Button className="flex-1" size="sm">
                <UserPlus className="mr-1.5 h-4 w-4" />
                Convert to Customer
              </Button>
              <a href={`tel:${lead.phone}`}>
                <Button variant="outline" size="icon-sm">
                  <Phone className="h-4 w-4" />
                </Button>
              </a>
              {lead.email ? (
                <a href={`mailto:${lead.email}`}>
                  <Button variant="outline" size="icon-sm">
                    <Mail className="h-4 w-4" />
                  </Button>
                </a>
              ) : null}
              <Button variant="outline" size="icon-sm">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}

function OverviewTab({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <InfoCard label="Phone" value={lead.phone} icon={Phone} />
        <InfoCard
          label="Email"
          value={lead.email ?? "—"}
          icon={Mail}
        />
        <InfoCard
          label="Insurance Type"
          value={lead.insurance_type}
          icon={Tag}
        />
        <InfoCard
          label="Source"
          value={lead.source ?? "—"}
          icon={GlobeFallback}
        />
        <InfoCard
          label="Created"
          value={formatDate(lead.created_at)}
          icon={Calendar}
        />
        <InfoCard
          label="Updated"
          value={formatDate(lead.updated_at)}
          icon={Clock}
        />
      </div>

      <Separator />

      <div>
        <h4 className="mb-2 text-sm font-medium">Tags</h4>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">prospect</Badge>
          <Badge variant="outline">follow-up</Badge>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="mb-2 text-sm font-medium">Assigned Agent</h4>
        <div className="flex items-center gap-2 rounded-lg border bg-white dark:bg-card p-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
            {initials(lead.name)}
          </span>
          <div>
            <p className="text-sm font-medium">Unassigned</p>
            <p className="text-xs text-muted-foreground">No agent assigned yet</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotesTab({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-3">
      {lead.notes ? (
        <div className="rounded-lg border bg-white dark:bg-card p-3 text-sm text-slate-700 dark:text-slate-300 dark:text-slate-600">
          {lead.notes}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      )}
    </div>
  )
}

function ActivityTab({ lead }: { lead: Lead }) {
  const items = [
    { label: "Lead created", date: lead.created_at },
    { label: `Status changed to ${lead.status}`, date: lead.updated_at },
  ]
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-slate-700 dark:text-slate-300 dark:text-slate-600">{item.label}</p>
            <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function DocumentsTab({ lead }: { lead: Lead }) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
      <FileText className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p className="text-sm text-muted-foreground">No documents attached</p>
    </div>
  )
}

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg border bg-white dark:bg-card p-2.5">
      <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}

function GlobeFallback({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "??"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}
