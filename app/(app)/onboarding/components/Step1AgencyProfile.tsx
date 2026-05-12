"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InlineSpinner } from "@/components/zims/loading-spinner";
import { AGENCY_SETTINGS_TIMEZONES } from "@/lib/schemas";

function normalizeTimezone(raw: string): string {
  if ((AGENCY_SETTINGS_TIMEZONES as readonly string[]).includes(raw)) {
    return raw;
  }
  return "UTC";
}

function logoPreviewUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function Step1AgencyProfile({
  initialAgencyName,
  onContinue,
}: {
  initialAgencyName: string;
  onContinue: () => void;
}) {
  const [displayName, setDisplayName] = useState(initialAgencyName);
  const [logoUrl, setLogoUrl] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const preview = useMemo(() => logoPreviewUrl(logoUrl), [logoUrl]);

  function submit() {
    const name = displayName.trim();
    if (name.length < 2) {
      setError("Agency display name must be at least 2 characters.");
      return;
    }
    setError(null);
    start(async () => {
      const body: Record<string, string> = {
        email_sender_name: name,
        timezone: normalizeTimezone(timezone),
      };
      const trimmedLogo = logoUrl.trim();
      if (trimmedLogo) body.logo_url = trimmedLogo;

      const res = await fetch("/api/zims/agency/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof payload.error === "string"
            ? payload.error
            : "Could not save agency profile",
        );
        return;
      }
      onContinue();
    });
  }

  return (
    <div className="space-y-6 transition-opacity duration-150 ease-in-out">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Agency profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is how your agency appears in customer emails and the workspace.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="onb-agency-name">Agency display name</Label>
        <Input
          id="onb-agency-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your agency name"
          autoComplete="organization"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="onb-logo">Logo URL (optional)</Label>
        <Input
          id="onb-logo"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://…"
          inputMode="url"
        />
        {preview ? (
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Logo preview"
              className="h-12 w-12 rounded-md border border-border object-contain"
              width={48}
              height={48}
            />
            <span className="text-xs text-muted-foreground">Preview</span>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Timezone</Label>
        <Select
          value={normalizeTimezone(timezone)}
          onValueChange={(v) => setTimezone(v ?? "UTC")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {AGENCY_SETTINGS_TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="h-11 w-full bg-indigo-600 text-base text-white transition-all duration-150 ease-in-out hover:bg-indigo-700"
        disabled={pending}
        onClick={() => submit()}
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <InlineSpinner className="text-white" />
            Saving…
          </span>
        ) : (
          "Continue"
        )}
      </Button>
    </div>
  );
}
