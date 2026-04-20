"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { updateAgencyProfileAction } from "../actions";
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
  AgencyProfileFormSchema,
  type AgencyProfileFormValues,
  type AgencySettings,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

function LogoPreview({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    <Image
      src={src}
      alt=""
      width={48}
      height={48}
      unoptimized
      className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
      onError={() => setBroken(true)}
    />
  );
}

function logoPreviewUrl(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function AgencyProfileForm({ settings }: { settings: AgencySettings }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const form = useForm<AgencyProfileFormValues>({
    resolver: zodResolver(AgencyProfileFormSchema),
    defaultValues: {
      whatsapp_number: settings.whatsapp_number ?? "",
      email_sender_name: settings.email_sender_name ?? "",
      logo_url: settings.logo_url ?? "",
    },
  });

  const logoValue = useWatch({ control: form.control, name: "logo_url" });
  const previewSrc = useMemo(() => logoPreviewUrl(logoValue ?? ""), [logoValue]);

  useEffect(() => {
    form.reset({
      whatsapp_number: settings.whatsapp_number ?? "",
      email_sender_name: settings.email_sender_name ?? "",
      logo_url: settings.logo_url ?? "",
    });
  }, [
    settings.updated_at,
    settings.whatsapp_number,
    settings.email_sender_name,
    settings.logo_url,
    form,
  ]);

  function onSubmit(values: AgencyProfileFormValues) {
    const fd = new FormData();
    fd.set("whatsapp_number", values.whatsapp_number);
    fd.set("email_sender_name", values.email_sender_name);
    fd.set("logo_url", values.logo_url);
    start(async () => {
      const res = await updateAgencyProfileAction(fd);
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
      <h2 className="text-[15px] font-semibold tracking-tight">Agency profile</h2>
      <p className="text-[13px] text-muted-foreground mb-5 mt-1">
        Your agency contact details and branding
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="whatsapp_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium mb-1 block">
                  WhatsApp number
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="+601X-XXXXXXX"
                    disabled={pending}
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage className="text-xs mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email_sender_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium mb-1 block">
                  Email sender name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="My Insurance Agency"
                    disabled={pending}
                    autoComplete="off"
                  />
                </FormControl>
                <FormMessage className="text-xs mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="logo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium mb-1 block">
                  Logo URL
                </FormLabel>
                <div className="flex flex-wrap items-start gap-3">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://..."
                      disabled={pending}
                      autoComplete="off"
                      className="min-w-0 flex-1"
                    />
                  </FormControl>
                  {previewSrc ? (
                    <LogoPreview key={previewSrc} src={previewSrc} />
                  ) : null}
                </div>
                <FormMessage className="text-xs mt-1" />
              </FormItem>
            )}
          />
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={pending}
              className={cn(
                "h-9 min-w-[140px] bg-indigo-600 text-white hover:bg-indigo-700",
              )}
            >
              {pending ? (
                <>
                  <InlineSpinner className="mr-2" />
                  Save profile
                </>
              ) : (
                "Save profile"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
