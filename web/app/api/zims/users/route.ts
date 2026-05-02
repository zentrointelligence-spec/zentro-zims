import { NextResponse } from "next/server";

import { ApiError, onboardingCreateUser } from "@/lib/api";
import { CreateUserSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const user = await onboardingCreateUser(parsed.data);
    return NextResponse.json(user);
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
