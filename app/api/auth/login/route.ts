import { NextResponse } from "next/server";

import { api, ApiError } from "@/lib/api";
import { setSession } from "@/lib/auth";
import { LoginPayload } from "@/lib/schemas";

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = LoginPayload.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const { access_token, user } = await api.auth.login(parsed.data);
    await setSession(access_token, user);
    return NextResponse.json({ user });
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
