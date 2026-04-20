"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createQuoteAction, updateQuoteAction } from "../actions";
import { Button } from "@/components/ui/button";
import { toastMutationError } from "@/components/zims/app-toast";
import { InlineSpinner } from "@/components/zims/loading-spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  CreateQuoteSchema,
  UpdateQuoteSchema,
  type CreateQuoteFormValues,
  type Quote,
  type QuotePartyOption,
  type UpdateQuoteFormValues,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

const QUOTES_QUERY_KEY = ["quotes"] as const;

function PartySearchBlock({
  label,
  query,
  onQueryChange,
  options,
  selectedId,
  onSelect,
  onClear,
  disabled,
}: {
  label: string;
  query: string;
  onQueryChange: (q: string) => void;
  options: QuotePartyOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 50);
  }, [options, query]);

  const selected = options.find((o) => o.id === selectedId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <FormLabel>{label}</FormLabel>
        {selectedId ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-6 text-xs"
            disabled={disabled}
            onClick={() => {
              onClear();
              onQueryChange("");
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={`Search ${label.toLowerCase()}…`}
        disabled={disabled}
        autoComplete="off"
      />
      {selectedId && selected ? (
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{selected.name}</span>
        </p>
      ) : null}
      <div
        className="max-h-40 overflow-y-auto rounded-md border border-border bg-muted/20"
        role="listbox"
      >
        {filtered.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">No matches</p>
        ) : (
          filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                onSelect(o.id);
                onQueryChange("");
              }}
              className={cn(
                "flex w-full items-center px-3 py-2 text-left text-sm hover:bg-muted",
                selectedId === o.id && "bg-muted font-medium",
              )}
            >
              {o.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function QuoteForm({
  mode,
  quote,
  leads,
  customers,
  partyLabel,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  quote?: Quote;
  leads: QuotePartyOption[];
  customers: QuotePartyOption[];
  /** Read-only context on edit (lead or customer name). */
  partyLabel?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [leadQuery, setLeadQuery] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");

  const createDefaults: CreateQuoteFormValues = {
    lead_id: "",
    customer_id: "",
    policy_type: "",
    insurer: "",
    premium_quoted: "",
    valid_until: "",
    notes: "",
  };

  const editDefaults: UpdateQuoteFormValues = quote
    ? {
        policy_type: quote.policy_type,
        insurer: quote.insurer,
        premium_quoted: quote.premium_quoted,
        valid_until: quote.valid_until.slice(0, 10),
        notes: quote.notes ?? "",
      }
    : {
        policy_type: "",
        insurer: "",
        premium_quoted: "",
        valid_until: "",
        notes: "",
      };

  const createForm = useForm({
    resolver: zodResolver(CreateQuoteSchema),
    defaultValues: createDefaults,
  });

  const editForm = useForm({
    resolver: zodResolver(UpdateQuoteSchema),
    defaultValues: editDefaults,
  });

  useEffect(() => {
    if (mode === "edit" && quote) {
      editForm.reset({
        policy_type: quote.policy_type,
        insurer: quote.insurer,
        premium_quoted: quote.premium_quoted,
        valid_until: quote.valid_until.slice(0, 10),
        notes: quote.notes ?? "",
      });
    }
  }, [mode, quote, editForm]);

  const createMutation = useMutation({
    mutationFn: (values: CreateQuoteFormValues) => createQuoteAction(values),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Quote created");
      void queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      createForm.reset(createDefaults);
      setLeadQuery("");
      setCustomerQuery("");
      onSuccess?.();
      router.refresh();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateQuoteFormValues) =>
      updateQuoteAction(String(quote!.id), values),
    onSuccess: (res) => {
      if (!res.ok) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Quote updated");
      void queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
      onSuccess?.();
      router.refresh();
    },
    onError: (err: Error) => {
      toastMutationError(err.message);
    },
  });

  const busy = createMutation.isPending || updateMutation.isPending;

  function onCreateSubmit(values: CreateQuoteFormValues) {
    createMutation.mutate(values);
  }

  function onEditSubmit(values: UpdateQuoteFormValues) {
    updateMutation.mutate(values);
  }

  if (mode === "create") {
    return (
      <Form {...createForm}>
        <form
          onSubmit={createForm.handleSubmit(onCreateSubmit)}
          className="grid max-h-[min(70vh,640px)] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2"
        >
          <div className="space-y-3 sm:col-span-2">
            <FormField
              control={createForm.control}
              name="lead_id"
              render={({ field }) => (
                <FormItem>
                  <PartySearchBlock
                    label="Lead"
                    query={leadQuery}
                    onQueryChange={setLeadQuery}
                    options={leads}
                    selectedId={(field.value ?? "").trim()}
                    onSelect={(id) => {
                      field.onChange(id);
                      createForm.setValue("customer_id", "", {
                        shouldValidate: true,
                      });
                    }}
                    onClear={() => {
                      field.onChange("");
                      createForm.trigger("lead_id");
                    }}
                    disabled={busy}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <PartySearchBlock
                    label="Customer"
                    query={customerQuery}
                    onQueryChange={setCustomerQuery}
                    options={customers}
                    selectedId={(field.value ?? "").trim()}
                    onSelect={(id) => {
                      field.onChange(id);
                      createForm.setValue("lead_id", "", {
                        shouldValidate: true,
                      });
                    }}
                    onClear={() => {
                      field.onChange("");
                      createForm.trigger("customer_id");
                    }}
                    disabled={busy}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={createForm.control}
            name="policy_type"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Policy type</FormLabel>
                <FormControl>
                  <Input {...field} disabled={busy} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={createForm.control}
            name="insurer"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Insurer</FormLabel>
                <FormControl>
                  <Input {...field} disabled={busy} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={createForm.control}
            name="premium_quoted"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Premium quoted</FormLabel>
                <FormControl>
                  <Input {...field} type="number" inputMode="decimal" step="0.01" min="0" disabled={busy} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={createForm.control}
            name="valid_until"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid until</FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={busy} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={createForm.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={3}
                    disabled={busy}
                    className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <InlineSpinner className="mr-2" />
                  Create quote
                </>
              ) : (
                "Create quote"
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...editForm}>
      <form
        onSubmit={editForm.handleSubmit(onEditSubmit)}
        className="grid max-h-[min(70vh,560px)] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2"
      >
        {partyLabel ? (
          <div className="rounded-md border border-dashed bg-muted/30 p-3 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Linked to: </span>
            <span className="font-medium">{partyLabel}</span>
          </div>
        ) : null}

        <FormField
          control={editForm.control}
          name="policy_type"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Policy type</FormLabel>
              <FormControl>
                <Input {...field} disabled={busy} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="insurer"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Insurer</FormLabel>
              <FormControl>
                <Input {...field} disabled={busy} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="premium_quoted"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Premium quoted</FormLabel>
              <FormControl>
                <Input {...field} type="number" inputMode="decimal" step="0.01" min="0" disabled={busy} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="valid_until"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valid until</FormLabel>
              <FormControl>
                <Input {...field} type="date" disabled={busy} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={editForm.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  rows={3}
                  disabled={busy}
                  className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? (
              <>
                <InlineSpinner className="mr-2" />
                Save changes
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
