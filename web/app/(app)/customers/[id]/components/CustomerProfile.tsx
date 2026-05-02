"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import { CustomerForm } from "../../components/CustomerForm";
import { LinkedPolicies } from "./LinkedPolicies";
import { Button } from "@/components/ui/button";
import {
  Card,
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
        <CardHeader className="flex flex-col gap-5 space-y-0 p-0 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600 text-xl font-bold text-white"
              aria-hidden
            >
              {initials(customer.name)}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-[20px] font-bold leading-tight tracking-tight text-slate-900">
                {customer.name}
              </CardTitle>
              <CardDescription className="sr-only">Contact details</CardDescription>
              <div className="mt-3 space-y-2 text-[13px] text-slate-600">
                <p className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {displayPhone(customer.phone)}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {displayEmail(customer.email)}
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {displayAddress(customer.address)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
              {policies.length} policies
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {policies[0] ? (
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {policies[0].status.replace(/_/g, " ")}
                </span>
              ) : (
                "No policy status"
              )}
            </span>
          </div>
        </CardHeader>
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
