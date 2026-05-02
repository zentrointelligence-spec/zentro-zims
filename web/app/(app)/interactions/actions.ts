"use server";

import { revalidatePath } from "next/cache";

import { createInteraction, ApiError, humanizeDetail } from "@/lib/api";
import { CreateInteractionSchema, InteractionSchema } from "@/lib/schemas";

export type SendMessageResult =
  | { success: true }
  | { success: false; error: string };

export async function sendMessageAction(
  formData: FormData,
): Promise<SendMessageResult> {
  const raw = {
    lead_id: formData.get("lead_id"),
    message: formData.get("message"),
    direction: "outgoing" as const,
    channel: formData.get("channel"),
  };

  const parsed = CreateInteractionSchema.safeParse({
    lead_id: raw.lead_id,
    message: raw.message,
    direction: raw.direction,
    channel: raw.channel,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const sendWhatsApp = parsed.data.channel === "whatsapp";

  try {
    const res = await createInteraction(parsed.data, { sendWhatsApp });
    const out = InteractionSchema.safeParse(res);
    if (!out.success) {
      return { success: false, error: "Unexpected response from server" };
    }
    revalidatePath("/interactions");
    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        success: false,
        error: humanizeDetail(err.detail) ?? err.message,
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
