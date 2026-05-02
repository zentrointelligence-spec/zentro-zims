"use client";

import { Clipboard, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { CustomerRowActions } from "./CustomerRowActions";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/zims/empty-state";
import { PageFade } from "@/components/zims/PageFade";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable } from "@/components/zims/data-table";
import type { Customer } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";

function displayPhone(phone: string) {
  if (!phone || phone === "00000") return "—";
  return phone;
}

function displayEmail(email: string | null | undefined) {
  if (!email) return "—";
  return email;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function avatarTone(name: string): string {
  const tones = [
    "bg-brand-500",
    "bg-brand-600",
    "bg-blue-500",
    "bg-teal-500",
    "bg-violet-500",
  ];
  const ch = name.trim().charCodeAt(0) || 0;
  return tones[ch % tones.length]!;
}

export function CustomersTable({
  customers,
  page,
  pages,
  total,
  pageSize,
  currentSearch,
}: {
  customers: Customer[];
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  currentSearch: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [navPending, startNav] = useTransition();

  function applySearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("search") ?? "").trim();
    startNav(() => {
      const p = new URLSearchParams(params);
      if (q) p.set("search", q);
      else p.delete("search");
      p.delete("page");
      router.push(`/customers?${p.toString()}`);
    });
  }

  function go(next: number) {
    if (next < 1 || next > pages || navPending) return;
    startNav(() => {
      const p = new URLSearchParams(params);
      if (next === 1) p.delete("page");
      else p.set("page", String(next));
      router.push(`/customers?${p.toString()}`);
    });
  }

  const start_ = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const isFilteredEmpty = customers.length === 0 && currentSearch.trim() !== "";
  const isTrulyEmpty = customers.length === 0 && currentSearch.trim() === "";

  return (
    <PageFade>
      <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <form
          onSubmit={applySearch}
          className="flex w-full max-w-md flex-1 flex-wrap items-end gap-2"
        >
          <div className="min-w-0 flex-1">
            <label
              className="mb-1 block text-xs text-muted-foreground"
              htmlFor="customer-search"
            >
              Search name or phone
            </label>
            <Input
              id="customer-search"
              name="search"
              type="search"
              placeholder="Search…"
              defaultValue={currentSearch}
              disabled={navPending}
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={navPending}>
            Search
          </Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-md border">
        {isTrulyEmpty ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Policies</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    title="No customers yet"
                    description="Customers are created when you convert a lead or add one manually"
                    icon={Users}
                    action={
                      <Link
                        href="/customers?create=1"
                        className={buttonVariants({ variant: "default" })}
                      >
                        New customer
                      </Link>
                    }
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : isFilteredEmpty ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Policies</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <div className="flex flex-col items-center justify-center gap-3 py-14 text-center text-sm text-muted-foreground">
                    No customers match your filters.
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <DataTable
            columns={["Name", "Phone", "Email", "Policies", "Created At", "Actions"]}
            columnHeaderClassName={[
              "",
              "hidden md:table-cell",
              "hidden md:table-cell",
              "hidden md:table-cell",
              "hidden md:table-cell",
              "",
            ]}
          >
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="px-0 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${avatarTone(c.name)}`}
                    >
                      {initials(c.name)}
                    </span>
                    <Link
                      href={`/customers/${c.id}`}
                      className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {c.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="group hidden px-0 py-2.5 text-sm text-muted-foreground md:table-cell">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5"
                    onClick={() =>
                      navigator.clipboard.writeText(displayPhone(c.phone))
                    }
                  >
                    <span>{displayPhone(c.phone)}</span>
                    <Clipboard className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </TableCell>
                <TableCell className="group hidden max-w-[220px] truncate px-0 py-2.5 text-sm text-muted-foreground md:table-cell">
                  <button
                    type="button"
                    className="inline-flex max-w-full items-center gap-1.5"
                    onClick={() =>
                      navigator.clipboard.writeText(displayEmail(c.email))
                    }
                  >
                    <span className="truncate">{displayEmail(c.email)}</span>
                    <Clipboard className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </TableCell>
                <TableCell className="hidden px-0 py-2.5 md:table-cell">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                    —
                  </span>
                </TableCell>
                <TableCell className="hidden px-0 py-2.5 text-sm text-muted-foreground tabular-nums md:table-cell">
                  {formatDate(c.created_at)}
                </TableCell>
                <TableCell className="px-0 py-2.5 text-right">
                  <CustomerRowActions customer={c} />
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {total === 0
            ? "No results"
            : `Showing ${start_}–${end} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || navPending}
            onClick={() => go(page - 1)}
          >
            Prev
          </Button>
          <span className="tabular-nums text-muted-foreground">
            Page {page} / {Math.max(pages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages || navPending}
            onClick={() => go(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      </div>
    </PageFade>
  );
}
