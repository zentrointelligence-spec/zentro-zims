import { NextResponse } from "next/server";

import { ApiError, onboardingImportPolicies } from "@/lib/api";
import { ImportResult } from "@/lib/schemas";

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing Excel file" }, { status: 400 });
  }

  const name = file.name || "import.xlsx";
  if (!name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json(
      { error: "Only .xlsx files are supported" },
      { status: 422 },
    );
  }

  const dryRun = form.get("dry_run") === "true";
  const contentType =
    file.type ||
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  try {
    const buf = await file.arrayBuffer();
    const raw = await onboardingImportPolicies({
      filename: name,
      content: buf,
      contentType,
      dryRun,
    });
    const parsed = ImportResult.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Unexpected import response shape" },
        { status: 502 },
      );
    }
    return NextResponse.json(parsed.data);
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
