"use client";

import { UserPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { InviteUserForm } from "./InviteUserForm";
import { TeamRowActions } from "./TeamRowActions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableCell, TableRow } from "@/components/ui/table";
import { DataTable } from "@/components/zims/data-table";
import { EmptyState } from "@/components/zims/empty-state";
import { PageFade } from "@/components/zims/PageFade";
import { PageHeader } from "@/components/zims/page-header";
import type { User } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (
    (parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)).toUpperCase()
  );
}

function RoleBadge({ role }: { role: User["role"] }) {
  const styles =
    role === "admin"
      ? "bg-[#ede9fe] text-[#5b21b6]"
      : "bg-[#dbeafe] text-[#1d4ed8]";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${styles}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  const styles = active
    ? "bg-[#dcfce7] text-[#15803d]"
    : "bg-[#f1f0e8] text-[#6b6b66]";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${styles}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function TeamTable({
  users,
  page,
  pages,
  total,
  pageSize,
  currentUserId,
}: {
  users: User[];
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  currentUserId: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [navPending, startNav] = useTransition();

  useKeyboardShortcut("n", () => setInviteOpen(true), !inviteOpen);

  function go(next: number) {
    if (next < 1 || next > pages || navPending) return;
    startNav(() => {
      const p = new URLSearchParams(params);
      if (next === 1) p.delete("page");
      else p.set("page", String(next));
      router.push(`/team?${p.toString()}`);
    });
  }

  const start_ = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Invite agents and manage who can access your agency workspace."
        actions={
          <Button type="button" onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Invite user
          </Button>
        }
      />

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
            <DialogDescription>
              Create a login for a new team member. They can sign in immediately
              with the password you set.
            </DialogDescription>
          </DialogHeader>
          <InviteUserForm
            onSuccess={() => setInviteOpen(false)}
            onCancel={() => setInviteOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle>Team members</CardTitle>
            <CardDescription>
              {total} total · page {page} of {Math.max(pages, 1)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <PageFade>
          {users.length === 0 ? (
            <EmptyState
              title="No team members yet"
              description="Invite your first agent to get started"
              icon={UserPlus}
              action={
                <Button type="button" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Invite user
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <DataTable
                  columns={["Name", "Email", "Role", "Status", "Joined", "Actions"]}
                  columnHeaderClassName={[
                    "",
                    "hidden md:table-cell",
                    "",
                    "hidden md:table-cell",
                    "hidden md:table-cell",
                    "",
                  ]}
                >
                  {users.map((u) => (
                    <TableRow key={u.id} className="border-b border-border/50 last:border-0">
                      <TableCell className="px-0 py-2.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#4f46e5] text-[12px] font-semibold text-white"
                            aria-hidden
                          >
                            {initials(u.name)}
                          </div>
                          <span className="font-medium text-foreground">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden px-0 py-2.5 text-sm text-muted-foreground md:table-cell">
                        {u.email}
                      </TableCell>
                      <TableCell className="px-0 py-2.5">
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="hidden px-0 py-2.5 md:table-cell">
                        <StatusBadge active={u.is_active} />
                      </TableCell>
                      <TableCell className="hidden px-0 py-2.5 text-sm text-muted-foreground tabular-nums md:table-cell">
                        {formatDate(u.created_at)}
                      </TableCell>
                      <TableCell className="px-0 py-2.5 text-right">
                        <TeamRowActions user={u} currentUserId={currentUserId} />
                      </TableCell>
                    </TableRow>
                  ))}
                </DataTable>
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
            </>
          )}
          </PageFade>
        </CardContent>
      </Card>
    </div>
  );
}
