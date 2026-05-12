"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, SlidersHorizontal, Search, Calendar } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { slideInRight } from "@/lib/motion-config"
import { cn } from "@/lib/utils"

export interface FilterState {
  search: string
  status: string
  dateFrom: string
  dateTo: string
  tags: string[]
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
]

const TAG_OPTIONS = ["hot", "follow-up", "vip", "cold", "renewal"]

export function TableFilters({
  filters,
  onChange,
  onApply,
  onCancel,
  open,
  onClose,
}: {
  filters: FilterState
  onChange: (filters: FilterState) => void
  onApply: (filters: FilterState) => void
  onCancel: () => void
  open: boolean
  onClose: () => void
}) {
  const [local, setLocal] = useState<FilterState>(filters)
  const prevOpenRef = useRef(open)

  // Sync local state when drawer opens
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setLocal(filters)
    }
    prevOpenRef.current = open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function update<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    const next = { ...local, [key]: value }
    setLocal(next)
    onChange(next)
  }

  function toggleTag(tag: string) {
    const nextTags = local.tags.includes(tag)
      ? local.tags.filter((t) => t !== tag)
      : [...local.tags, tag]
    update("tags", nextTags)
  }

  function clearAll() {
    const cleared: FilterState = {
      search: "",
      status: "all",
      dateFrom: "",
      dateTo: "",
      tags: [],
    }
    setLocal(cleared)
    onChange(cleared)
  }

  function removeChip(key: keyof FilterState, value?: string | null) {
    if (key === "tags" && value) {
      update("tags", local.tags.filter((t) => t !== value))
    } else if (key === "search") {
      update("search", "")
    } else if (key === "status") {
      update("status", "all")
    } else if (key === "dateFrom") {
      update("dateFrom", "")
    } else if (key === "dateTo") {
      update("dateTo", "")
    }
  }

  const activeChips = getActiveChips(local)

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-sm sm:max-w-md">
        <motion.div
          initial={slideInRight.initial}
          animate={slideInRight.animate}
          exit={slideInRight.exit}
          transition={slideInRight.transition}
          className="flex h-full flex-col"
        >
          <SheetHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* Active chips */}
          <div className="mt-4 min-h-[40px]">
            <AnimatePresence>
              {activeChips.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-1.5"
                >
                  {activeChips.map((chip) => (
                    <motion.div
                      key={chip.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Badge
                        variant="secondary"
                        className="gap-1 pr-1 text-xs"
                      >
                        {chip.label}
                        <button
                          type="button"
                          onClick={() => removeChip(chip.key, chip.value)}
                          className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-slate-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            {activeChips.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-auto px-0 py-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={clearAll}
              >
                Clear All
              </Button>
            )}
          </div>

          <Separator className="my-4" />

          {/* Filter form */}
          <div className="flex-1 space-y-5 overflow-y-auto pr-1">
            <div>
              <Label htmlFor="filter-search" className="mb-1.5 block">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="filter-search"
                  placeholder="Search name or phone…"
                  value={local.search}
                  onChange={(e) => update("search", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filter-status" className="mb-1.5 block">
                Status
              </Label>
              <Select
                value={local.status}
                onValueChange={(v) => update("status", v || "")}
              >
                <SelectTrigger id="filter-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={local.dateFrom}
                    onChange={(e) => update("dateFrom", e.target.value)}
                    className="pl-9 text-sm"
                    placeholder="From"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={local.dateTo}
                    onChange={(e) => update("dateTo", e.target.value)}
                    className="pl-9 text-sm"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => {
                  const active = local.tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        active
                          ? "border-brand-200 bg-brand-50 text-brand-700"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-card text-slate-600 dark:text-slate-300 hover:bg-slate-50",
                      )}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 shrink-0 border-t pt-4">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  onApply(local)
                  onClose()
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}

function getActiveChips(filters: FilterState): {
  id: string
  key: keyof FilterState
  value?: string
  label: string
}[] {
  const chips: ReturnType<typeof getActiveChips> = []
  if (filters.search) {
    chips.push({ id: "search", key: "search", label: `Search: ${filters.search}` })
  }
  if (filters.status && filters.status !== "all") {
    chips.push({
      id: "status",
      key: "status",
      label: `Status: ${filters.status}`,
    })
  }
  if (filters.dateFrom) {
    chips.push({ id: "from", key: "dateFrom", label: `From: ${filters.dateFrom}` })
  }
  if (filters.dateTo) {
    chips.push({ id: "to", key: "dateTo", label: `To: ${filters.dateTo}` })
  }
  filters.tags.forEach((tag) => {
    chips.push({ id: `tag-${tag}`, key: "tags", value: tag, label: tag })
  })
  return chips
}
