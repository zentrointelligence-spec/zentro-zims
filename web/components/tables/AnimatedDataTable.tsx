"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { staggerContainer, staggerItem } from "@/lib/motion-config"
import { cn } from "@/lib/utils"

export type SortDirection = "asc" | "desc" | null

export interface Column<T> {
  key: string
  header: string
  width?: string
  sortable?: boolean
  cell: (row: T) => React.ReactNode
  className?: string
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
  pages: number
}

export function AnimatedDataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading,
  pagination,
  onSort,
  onRowClick,
  emptyTitle = "No results",
  emptyDescription = "There are no items to display.",
}: {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  pagination?: PaginationState
  onSort?: (key: string, direction: SortDirection) => void
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
}) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [selectedId, setSelectedId] = useState<string | number | null>(null)

  function handleSort(key: string) {
    let nextDirection: SortDirection = "asc"
    if (sortKey === key) {
      if (sortDirection === "asc") nextDirection = "desc"
      else if (sortDirection === "desc") nextDirection = null
      else nextDirection = "asc"
    }
    setSortKey(nextDirection ? key : null)
    setSortDirection(nextDirection)
    onSort?.(key, nextDirection)
  }

  function handleRowClick(row: T) {
    setSelectedId(row.id)
    onRowClick?.(row)
  }

  const skeletonRows = useMemo(() => {
    return Array.from({ length: pagination?.pageSize ?? 5 }, (_, i) => i)
  }, [pagination?.pageSize])

  const isEmpty = !isLoading && data.length === 0

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.className,
                    col.sortable && "cursor-pointer select-none",
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="inline-flex flex-col">
                        <ChevronUp
                          className={cn(
                            "-mb-1 h-3 w-3 transition-colors",
                            sortKey === col.key && sortDirection === "asc"
                              ? "text-foreground"
                              : "text-muted-foreground/40",
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            "-mt-1 h-3 w-3 transition-colors",
                            sortKey === col.key && sortDirection === "desc"
                              ? "text-foreground"
                              : "text-muted-foreground/40",
                          )}
                        />
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <TableBody key="loading">
                {skeletonRows.map((idx) => (
                  <TableRow key={`sk-${idx}`}>
                    {columns.map((col) => (
                      <TableCell key={`${idx}-${col.key}`}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            ) : isEmpty ? (
              <TableBody key="empty">
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-[300px] text-center"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center"
                    >
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <Search className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {emptyTitle}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {emptyDescription}
                      </p>
                    </motion.div>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody key="data">
                <motion.tr
                  className="contents"
                  variants={staggerContainer as any}
                  initial="initial"
                  animate="animate"
                >
                  {data.map((row) => (
                    <motion.tr
                      key={row.id}
                      variants={staggerItem as any}
                      className={cn(
                        "border-b transition-colors hover:bg-muted/50",
                        selectedId === row.id &&
                          "bg-brand-50 dark:bg-brand-900/20",
                      )}
                      onClick={() => handleRowClick(row)}
                      style={{ cursor: onRowClick ? "pointer" : "default" }}
                    >
                      {columns.map((col) => (
                        <TableCell key={`${row.id}-${col.key}`} className={col.className}>
                          {col.cell(row)}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))}
                </motion.tr>
              </TableBody>
            )}
          </AnimatePresence>
        </Table>
      </div>

      {pagination && pagination.pages > 1 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={pagination.page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1}–
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}{" "}
              of {pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() =>
                  pagination &&
                  pagination.page > 1 &&
                  handlePageChange(pagination, pagination.page - 1)
                }
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prev
              </Button>
              <span className="tabular-nums text-muted-foreground">
                Page {pagination.page} / {Math.max(pagination.pages, 1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() =>
                  pagination &&
                  pagination.page < pagination.pages &&
                  handlePageChange(pagination, pagination.page + 1)
                }
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

function handlePageChange(pagination: PaginationState, nextPage: number) {
  // This is a placeholder - the actual page change would be handled by the parent
  // via the pagination prop being updated. We just prevent default behavior here.
}
