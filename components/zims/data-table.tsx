"use client";

import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function DataTable({
  columns,
  columnHeaderClassName,
  children,
  className,
}: {
  columns: string[];
  /** Optional per-column `<th>` classes (e.g. `hidden md:table-cell`). */
  columnHeaderClassName?: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="card w-full overflow-x-auto shadow-card">
      <Table
        className={cn(
          "w-full min-w-[520px] md:min-w-0",
          className,
        )}
      >
        <TableHeader className="sticky top-0 z-10 bg-slate-50">
          <TableRow className="border-b border-slate-200 hover:bg-transparent">
            {columns.map((col, i) => (
              <TableHead
                key={col}
                className={cn(
                  "h-11 bg-slate-50 px-4 text-[11px] font-semibold tracking-[0.05em] text-slate-500 uppercase",
                  columnHeaderClassName?.[i],
                )}
              >
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-b-0 [&_tr]:h-11 [&_tr]:border-b [&_tr]:border-b-slate-100 [&_tr]:bg-white [&_tr]:transition-colors hover:[&_tr]:bg-white [&_tr:hover]:bg-slate-50" >
          {children}
        </TableBody>
      </Table>
    </div>
  );
}
