import { NextResponse } from "next/server";

import {
  ApiError,
  onboardingPatchAgencySettings,
} from "@/lib/api";
import { UpdateAgencySettingsSchema } from "@/lib/schemas";

export async function PATCH(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = UpdateAgencySettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    await onboardingPatchAgencySettings(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: typeof err.detail === "string" ? err.detail : err.message },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: "Unable to reach ZIMS backend" },
      { status: 502 },
    );
  }
}
