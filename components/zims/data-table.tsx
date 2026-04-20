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
    <div className="w-full overflow-x-auto">
      <Table
        className={cn(
          "w-full min-w-[520px] md:min-w-0",
          className,
        )}
      >
        <TableHeader>
          <TableRow className="border-b border-border/60 hover:bg-transparent">
            {columns.map((col, i) => (
              <TableHead
                key={col}
                className={cn(
                  "h-10 px-0 text-[0.8125rem] font-medium text-muted-foreground",
                  columnHeaderClassName?.[i],
                )}
              >
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}
