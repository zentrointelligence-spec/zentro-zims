"use server";

import { revalidatePath } from "next/cache";

import { updateAgencySettings, ApiError, humanizeDetail } from "@/lib/api";
import {
  AgencyProfileFormSchema,
  NotificationTemplatesFormSchema,
  RenewalSettingsFormSchema,
} from "@/lib/schemas";

export type SettingsActionResult =
  | { success: true }
  | { success: false; error: string };

function fail(err: unknown): SettingsActionResult {
  if (err instanceof ApiError) {
    return {
      success: false,
      error: humanizeDetail(err.detail) ?? err.message,
    };
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  return { success: false, error: message };
}

function formText(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "");
}

export async function updateAgencyProfileAction(
  formData: FormData,
): Promise<SettingsActionResult> {
  const raw = {
    whatsapp_number: formText(formData, "whatsapp_number"),
    email_sender_name: formText(formData, "email_sender_name"),
    logo_url: formText(formData, "logo_url"),
  };
  const parsed = AgencyProfileFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  const whatsapp = parsed.data.whatsapp_number.trim();
  const emailName = parsed.data.email_sender_name.trim();
  const logo = parsed.data.logo_url.trim();
  try {
    await updateAgencySettings({
      whatsapp_number: whatsapp === "" ? null : whatsapp,
      email_sender_name: emailName === "" ? null : emailName,
      logo_url: logo === "" ? null : logo,
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return fail(err);
  }
}

export async function updateRenewalSettingsAction(
  formData: FormData,
): Promise<SettingsActionResult> {
  const daysRaw = formText(formData, "renewal_window_days");
  const days = Number(daysRaw);
  const raw = {
    renewal_window_days: days,
    renewal_message_template: formText(formData, "renewal_message_template"),
  };
  const parsed = RenewalSettingsFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  const tmpl = parsed.data.renewal_message_template.trim();
  try {
    await updateAgencySettings({
      renewal_window_days: parsed.data.renewal_window_days,
      renewal_message_template: tmpl === "" ? null : tmpl,
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return fail(err);
  }
}

export async function updateNotificationTemplatesAction(
  formData: FormData,
): Promise<SettingsActionResult> {
  const raw = {
    timezone: formText(formData, "timezone"),
    birthday_message_template: formText(
      formData,
      "birthday_message_template",
    ),
  };
  const parsed = NotificationTemplatesFormSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  const birthday = parsed.data.birthday_message_template.trim();
  try {
    await updateAgencySettings({
      timezone: parsed.data.timezone,
      birthday_message_template: birthday === "" ? null : birthday,
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return fail(err);
  }
}
