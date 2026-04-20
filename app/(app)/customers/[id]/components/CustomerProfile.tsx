"use client";

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";

import { CustomerForm } from "../../components/CustomerForm";
import { LinkedPolicies } from "./LinkedPolicies";
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
import type { Customer, Policy } from "@/lib/schemas";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return (
    (parts[0]!.slice(0, 1) + parts[parts.length - 1]!.slice(0, 1)).toUpperCase()
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_1fr] sm:items-baseline">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function displayPhone(phone: string) {
  if (!phone || phone === "00000") return "—";
  return phone;
}

function displayEmail(email: string | null | undefined) {
  if (!email) return "—";
  return email;
}

function displayAddress(address: string | null | undefined) {
  if (!address) return "—";
  return address;
}

export function CustomerProfile({
  customer,
  policies,
}: {
  customer: Customer;
  policies: Policy[];
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          render={<Link href="/customers" />}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to customers
        </Button>
        <Button type="button" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-1.5 h-4 w-4" />
          Edit
        </Button>
      </div>

      <Card className="rounded-lg border bg-card p-6 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start gap-4 space-y-0 p-0">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-semibold text-white"
            aria-hidden
          >
            {initials(customer.name)}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-xl font-medium leading-tight tracking-tight">
              {customer.name}
            </CardTitle>
            <CardDescription className="sr-only">Contact details</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-0 pt-6">
          <Row label="Phone" value={displayPhone(customer.phone)} />
          <Row label="Email" value={displayEmail(customer.email)} />
          <Row label="Address" value={displayAddress(customer.address)} />
        </CardContent>
      </Card>

      <LinkedPolicies customerId={customer.id} policies={policies} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>Update contact details for {customer.name}.</DialogDescription>
          </DialogHeader>
          <CustomerForm
            mode="edit"
            customer={customer}
            onSuccess={() => setEditOpen(false)}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
