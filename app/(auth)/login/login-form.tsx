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
import { LoginPayload } from "@/lib/schemas";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const form = useForm<LoginPayload>({
    resolver: zodResolver(LoginPayload),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginPayload) {
    start(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          user?: { name: string };
        };
        if (!res.ok) {
          toast.error(body.error || "Invalid email or password");
          return;
        }
        toast.success(`Welcome back, ${body.user?.name ?? "there"}!`);
        router.replace(nextPath);
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
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="mb-2 block text-[13px] font-medium text-slate-700">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@agency.com"
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
          name="password"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="mb-2 block text-[13px] font-medium text-slate-700">
                Password
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
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
        <Button
          type="submit"
          className="mt-2 h-11 w-full rounded-[10px] border-0 bg-linear-to-br from-brand-500 to-brand-600 text-sm font-semibold text-white shadow-sm hover:brightness-110 hover:scale-[1.01] active:scale-[0.99]"
          disabled={pending}
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </Form>
  );
}
