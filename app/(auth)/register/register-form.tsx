"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
  FormMessage,
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
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="agency_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agency name</FormLabel>
              <FormControl>
                <Input placeholder="Mumbai Insurance Co." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="admin_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your name</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Priya Mehta" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="admin_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="priya@agency.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="admin_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subscription_plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="free">Free — up to 3 seats</SelectItem>
                  <SelectItem value="starter">Starter — $29/seat</SelectItem>
                  <SelectItem value="growth">Growth — $79/seat</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating workspace…" : "Create workspace"}
        </Button>
      </form>
    </Form>
  );
}
