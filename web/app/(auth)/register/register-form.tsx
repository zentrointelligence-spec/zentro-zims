"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RegisterPayload, RegisterResponse } from "@/lib/schemas";

export function RegisterForm() {
  const router = useRouter();
  const [pending, start] = useTransition();

  const form = useForm<RegisterPayload>({
    resolver: zodResolver(RegisterPayload),
    defaultValues: {
      agency_name: "",
      admin_name: "",
      admin_email: "",
      admin_password: "",
      subscription_plan: "free",
    },
  });

  function onSubmit(values: RegisterPayload) {
    start(async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errBody = body as { error?: string };
          toast.error(errBody.error || "Could not create your workspace");
          return;
        }
        const parsed = RegisterResponse.safeParse(body);
        const agencyName = parsed.success ? parsed.data.agency.name : "";
        toast.success("Workspace ready — welcome to Zentro!");
        const qs = new URLSearchParams();
        if (agencyName) qs.set("agency_name", agencyName);
        router.replace(
          qs.toString() ? `/onboarding?${qs.toString()}` : "/onboarding",
        );
        router.refresh();
      } catch {
        toast.error("Unable to reach Zentro — check your connection.");
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
      >
        <FormField
          control={form.control}
          name="agency_name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="mb-2 block text-[13px] font-medium text-slate-700">
                Agency name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Mumbai Insurance Co."
                  className="h-[42px] rounded-[10px] border-slate-200 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-brand-500 focus-visible:ring-[3px] focus-visible:ring-brand-500/20"
                  {...field}
                />
              </FormControl>
              {fieldState.error?.message ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {fieldState.error.message}
                </p>
              ) : null}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="admin_name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="mb-2 block text-[13px] font-medium text-slate-700">
                Your name
              </FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  placeholder="Priya Mehta"
                  className="h-[42px] rounded-[10px] border-slate-200 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-brand-500 focus-visible:ring-[3px] focus-visible:ring-brand-500/20"
                  {...field}
                />
              </FormControl>
              {fieldState.error?.message ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {fieldState.error.message}
                </p>
              ) : null}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="admin_email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="mb-2 block text-[13px] font-medium text-slate-700">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="priya@agency.com"
                  className="h-[42px] rounded-[10px] border-slate-200 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-brand-500 focus-visible:ring-[3px] focus-visible:ring-brand-500/20"
                  {...field}
                />
              </FormControl>
              {fieldState.error?.message ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {fieldState.error.message}
                </p>
              ) : null}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="admin_password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="mb-2 block text-[13px] font-medium text-slate-700">
                Password
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="h-[42px] rounded-[10px] border-slate-200 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-brand-500 focus-visible:ring-[3px] focus-visible:ring-brand-500/20"
                  {...field}
                />
              </FormControl>
              {fieldState.error?.message ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {fieldState.error.message}
                </p>
              ) : null}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subscription_plan"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="mb-2 block text-[13px] font-medium text-slate-700">
                Plan
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-[42px] rounded-[10px] border-slate-200 px-3.5 text-sm text-slate-900 focus-visible:border-brand-500 focus-visible:ring-[3px] focus-visible:ring-brand-500/20">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="free">Free — up to 3 seats</SelectItem>
                  <SelectItem value="starter">Starter — $29/seat</SelectItem>
                  <SelectItem value="growth">Growth — $79/seat</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.error?.message ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {fieldState.error.message}
                </p>
              ) : null}
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="mt-2 h-11 w-full rounded-[10px] border-0 bg-linear-to-br from-brand-500 to-brand-600 text-sm font-semibold text-white shadow-sm hover:brightness-110 hover:scale-[1.01] active:scale-[0.99]"
          disabled={pending}
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating workspace…
            </span>
          ) : (
            "Create workspace"
          )}
        </Button>
      </form>
    </Form>
  );
}
