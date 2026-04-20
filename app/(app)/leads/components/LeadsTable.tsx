"use client";

import { Loader2, Target } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateLeadStatusAction } from "../actions";
import { LeadRowActions } from "./LeadRowActions";
import { Button, buttonVariants } from "@/components/ui/button";
import { toastMutationError } from "@/components/zims/app-toast";
import { EmptyState } from "@/components/zims/empty-state";
import { PageFade } from "@/components/zims/PageFade";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusChip } from "@/components/zims/status-chip";
import type { Lead, LeadStatus } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";

const QUERY_KEY = ["leads"] as const;

const STATUS_CHOICES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

function LeadStatusSelect({
  lead,
  statusMutation,
}: {
  lead: Lead;
  statusMutation: UseMutationResult<
    Awaited<ReturnType<typeof updateLeadStatusAction>>,
    Error,
    { id: number; status: LeadStatus }
  >;
}) {
  const rowBusy =
    statusMutation.isPending && statusMutation.variables?.id === lead.id;

  return (
    <Select
      value={lead.status}
      onValueChange={(v) => {
        const next = v as LeadStatus;
        if (next === lead.status) return;
        statusMutation.mutate({ id: lead.id, status: next });
      }}
      disabled={rowBusy}
    >
      <SelectTrigger
        size="sm"
        className="h-9 w-[min(200px,100%)] gap-2"
        aria-label="Lead status"
      >
        <SelectValue className="sr-only">{lead.status}</SelectValue>
        {rowBusy ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <StatusChip status={lead.status} kind="lead" />
        )}
      </SelectTrigger>
      <SelectContent>
        {STATUS_CHOICES.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">
            {s.replace(/_/g, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LeadsTable({
  leads,
  page,
  pages,
  total,
  pageSize,
}: {
  leads: Lead[];
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const [navPending, startNav] = useTransition();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeadStatus }) =>
      updateLeadStatusAction(id, status),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Lead updated");
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        router.refresh();
      } else {
        toastMutationError(res.error);
      }
    },
  });

  function go(next: number) {
    if (next < 1 || next > pages || navPending) return;
    startNav(() => {
      const p = new URLSearchParams(params);
      if (next === 1) p.delete("page");
      else p.set("page", String(next));
      router.push(`/leads?${p.toString()}`);
    });
  }

  const start_ = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <PageFade>
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">
                  Insurance type
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      title="No leads yet"
                      description="Add your first lead to start tracking your sales pipeline"
                      icon={Target}
                      action={
                        <Link
                          href="/leads?create=1"
                          className={buttonVariants({ variant: "default" })}
                        >
                          New lead
                        </Link>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell className="hidden whitespace-nowrap text-sm md:table-cell">
                    {lead.phone}
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate text-sm text-muted-foreground md:table-cell">
                    {lead.email ?? "—"}
                  </TableCell>
                  <TableCell className="hidden capitalize md:table-cell">
                    {lead.insurance_type}
                  </TableCell>
                  <TableCell>
                    <LeadStatusSelect
                      lead={lead}
                      statusMutation={statusMutation}
                    />
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">
                    {formatDate(lead.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <LeadRowActions lead={lead} />
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
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
