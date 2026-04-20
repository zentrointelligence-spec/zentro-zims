"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import { updateRenewalSettingsAction } from "../actions";
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
import {
  DEFAULT_RENEWAL_MESSAGE_TEMPLATE,
  RenewalSettingsFormSchema,
  type AgencySettings,
  type RenewalSettingsFormValues,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

function clampRenewalDays(n: number): number {
  if (!Number.isFinite(n)) return 30;
  return Math.min(60, Math.max(7, Math.floor(n)));
}

export function RenewalSettingsForm({ settings }: { settings: AgencySettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const form = useForm<RenewalSettingsFormValues>({
    resolver: zodResolver(RenewalSettingsFormSchema),
    defaultValues: {
      renewal_window_days: clampRenewalDays(settings.renewal_window_days),
      renewal_message_template: settings.renewal_message_template ?? "",
    },
  });

  const days = useWatch({
    control: form.control,
    name: "renewal_window_days",
    defaultValue: clampRenewalDays(settings.renewal_window_days),
  });

  useEffect(() => {
    form.reset({
      renewal_window_days: clampRenewalDays(settings.renewal_window_days),
      renewal_message_template: settings.renewal_message_template ?? "",
    });
  }, [
    settings.updated_at,
    settings.renewal_window_days,
    settings.renewal_message_template,
    form,
  ]);

  function onSubmit(values: RenewalSettingsFormValues) {
    const fd = new FormData();
    fd.set("renewal_window_days", String(values.renewal_window_days));
    fd.set("renewal_message_template", values.renewal_message_template);
    start(async () => {
      const res = await updateRenewalSettingsAction(fd);
      if (!res.success) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Settings saved");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <RefreshCw className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Renewal settings</h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Configure when renewal reminders are sent
          </p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="renewal_window_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium mb-1 block">
                  Remind {days} days before expiry
                </FormLabel>
                <FormControl>
                  <input
                    type="range"
                    min={7}
                    max={60}
                    step={1}
                    disabled={pending}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className="h-2 w-full cursor-pointer accent-indigo-600 disabled:opacity-50"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Send renewal reminders {days} days before expiry
                </p>
                <FormMessage className="text-xs mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="renewal_message_template"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium mb-1 block">
                  Renewal message template
                </FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={4}
                    placeholder={DEFAULT_RENEWAL_MESSAGE_TEMPLATE}
                    disabled={pending}
                    className="flex min-h-[100px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Use {"{name}"}, {"{policy_number}"}, {"{expiry_date}"} as placeholders
                </p>
                <FormMessage className="text-xs mt-1" />
              </FormItem>
            )}
          />
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={pending}
              className={cn(
                "h-8 min-w-[180px] bg-gradient-to-br from-brand-500 to-brand-600 text-white hover:brightness-110",
              )}
            >
              {pending ? (
                <>
                  <InlineSpinner className="mr-2" />
                  Save renewal settings
                </>
              ) : (
                "Save renewal settings"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
