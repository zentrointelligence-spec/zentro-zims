"use server";

import { ApiError, generateAIContent, humanizeDetail } from "@/lib/api";
import { AIContentTypeSchema, AIGenerateRequestSchema } from "@/lib/schemas";

export type GenerateContentResult =
  | {
      success: true;
      content: string;
      type: string;
      generatedAt: string;
    }
  | { success: false; error: string };

export async function generateContentAction(
  formData: FormData,
): Promise<GenerateContentResult> {
  const typeParsed = AIContentTypeSchema.safeParse(
    String(formData.get("type") ?? ""),
  );
  if (!typeParsed.success) {
    return { success: false, error: "Invalid content type" };
  }

  const contextRaw = formData.get("context");
  let context: unknown = {};
  if (typeof contextRaw === "string" && contextRaw.trim()) {
    try {
      context = JSON.parse(contextRaw) as unknown;
    } catch {
      return { success: false, error: "Invalid context payload" };
    }
  }

  const body = AIGenerateRequestSchema.safeParse({
    type: typeParsed.data,
    context,
  });
  if (!body.success) {
    return {
      success: false,
      error: body.error.issues.map((i) => i.message).join("; "),
    };
  }

  try {
    const res = await generateAIContent(body.data);
    return {
      success: true,
      content: res.content,
      type: res.type,
      generatedAt: res.generated_at,
    };
  } catch (err) {
    const msg =
      err instanceof ApiError
        ? (humanizeDetail(err.detail) ?? err.message)
        : err instanceof Error
          ? err.message
          : "Unknown error";
    return { success: false, error: msg };
  }
}
