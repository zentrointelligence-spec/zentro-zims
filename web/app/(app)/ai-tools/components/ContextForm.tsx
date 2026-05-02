"use client";

import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { generateContentAction } from "../actions";
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
import type { AIContentType } from "@/lib/schemas";

type FormShape = {
  platform: "whatsapp" | "facebook" | "instagram";
  customer_name: string;
  policy_number: string;
  expiry_date: string;
  policy_type: string;
  insurer: string;
  premium: string;
};

function emptyDefaults(): FormShape {
  return {
    platform: "whatsapp",
    customer_name: "",
    policy_number: "",
    expiry_date: "",
    policy_type: "",
    insurer: "",
    premium: "",
  };
}

const selectShell =
  "flex h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

function buildContext(
  type: AIContentType,
  v: FormShape,
): Record<string, string> {
  const out: Record<string, string> = {};
  const add = (key: string, val: string | undefined) => {
    const t = (val ?? "").trim();
    if (t) out[key] = t;
  };
  switch (type) {
    case "marketing_post":
      if (v.platform) out.platform = v.platform;
      break;
    case "renewal_message":
      add("customer_name", v.customer_name);
      add("policy_number", v.policy_number);
      add("expiry_date", v.expiry_date);
      break;
    case "birthday_wish":
      add("customer_name", v.customer_name);
      break;
    case "quote_summary":
      add("customer_name", v.customer_name);
      add("policy_type", v.policy_type);
      add("insurer", v.insurer);
      add("premium", v.premium);
      break;
    case "follow_up_message":
      add("customer_name", v.customer_name);
      add("policy_type", v.policy_type);
      break;
    default:
      break;
  }
  return out;
}

export function ContextForm({
  selectedType,
  isGenerating,
  onBusyChange,
  onSuccess,
  onError,
}: {
  selectedType: AIContentType;
  isGenerating: boolean;
  onBusyChange: (busy: boolean) => void;
  onSuccess: (payload: { content: string; generatedAt: string }) => void;
  onError: (message: string) => void;
}) {
  const form = useForm<FormShape>({
    defaultValues: emptyDefaults(),
  });

  async function onSubmit(values: FormShape) {
    onBusyChange(true);
    try {
      const fd = new FormData();
      fd.set("type", selectedType);
      fd.set("context", JSON.stringify(buildContext(selectedType, values)));
      const res = await generateContentAction(fd);
      if (!res.success) {
        onError(res.error);
        return;
      }
      onSuccess({
        content: res.content,
        generatedAt: res.generatedAt,
      });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Request failed");
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-medium text-foreground">Context</p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 space-y-4"
        >
          {selectedType === "marketing_post" ? (
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Platform</FormLabel>
                  <FormControl>
                    <select {...field} className={selectShell} aria-label="Platform">
                      <option value="whatsapp">WhatsApp</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {selectedType === "renewal_message" ? (
            <>
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Customer name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ahmad bin Rahman" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="policy_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Policy number
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="POL-001-123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Expiry date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : null}

          {selectedType === "birthday_wish" ? (
            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Customer name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Siti Nurhaliza" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {selectedType === "quote_summary" ? (
            <>
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Customer name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="policy_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Policy type
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Medical Card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insurer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Insurer</FormLabel>
                    <FormControl>
                      <Input placeholder="Prudential" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="premium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Premium</FormLabel>
                    <FormControl>
                      <Input placeholder="1250.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : null}

          {selectedType === "follow_up_message" ? (
            <>
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Lead / customer name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Lead name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="policy_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Policy type
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Life Insurance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : null}

          <Button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generate
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
