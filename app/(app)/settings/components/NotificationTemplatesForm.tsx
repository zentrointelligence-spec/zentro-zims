"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { updateNotificationTemplatesAction } from "../actions";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AGENCY_SETTINGS_TIMEZONES,
  DEFAULT_BIRTHDAY_MESSAGE_TEMPLATE,
  NotificationTemplatesFormSchema,
  type AgencySettings,
  type NotificationTemplatesFormValues,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

function normalizeTimezone(raw: string): string {
  if ((AGENCY_SETTINGS_TIMEZONES as readonly string[]).includes(raw)) {
    return raw;
  }
  return "UTC";
}

export function NotificationTemplatesForm({
  settings,
}: {
  settings: AgencySettings;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const initialTz = useMemo(
    () => normalizeTimezone(settings.timezone || "UTC"),
    [settings.timezone],
  );

  const form = useForm<NotificationTemplatesFormValues>({
    resolver: zodResolver(NotificationTemplatesFormSchema),
    defaultValues: {
      timezone: initialTz,
      birthday_message_template: settings.birthday_message_template ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      timezone: normalizeTimezone(settings.timezone || "UTC"),
      birthday_message_template: settings.birthday_message_template ?? "",
    });
  }, [
    settings.updated_at,
    settings.timezone,
    settings.birthday_message_template,
    form,
  ]);

  function onSubmit(values: NotificationTemplatesFormValues) {
    const fd = new FormData();
    fd.set("timezone", values.timezone);
    fd.set("birthday_message_template", values.birthday_message_template);
    start(async () => {
      const res = await updateNotificationTemplatesAction(fd);
      if (!res.success) {
        toastMutationError(res.error);
        return;
      }
      toast.success("Settings saved");
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="text-[15px] font-semibold tracking-tight">
        Notification templates
      </h2>
      <p className="text-[13px] text-muted-foreground mb-5 mt-1">
        Customise automated messages sent to customers
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium mb-1 block">
                  Timezone
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={pending}
                >
                  <FormControl>
                    <SelectTrigger size="sm" className="h-9 w-full max-w-md">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AGENCY_SETTINGS_TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="birthday_message_template"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium mb-1 block">
                  Birthday message template
                </FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={4}
                    placeholder={DEFAULT_BIRTHDAY_MESSAGE_TEMPLATE}
                    disabled={pending}
                    className="flex min-h-[100px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">
                  Use {"{name}"} as placeholder
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
                "h-9 min-w-[200px] bg-indigo-600 text-white hover:bg-indigo-700",
              )}
            >
              {pending ? (
                <>
                  <InlineSpinner className="mr-2" />
                  Save notification settings
                </>
              ) : (
                "Save notification settings"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
