"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineSpinner } from "@/components/zims/loading-spinner";
import { ONBOARDING_TWILIO_WHATSAPP_DOC_URL } from "@/lib/schemas";

export function Step3WhatsApp({
  onContinue,
  onSkipToDashboard,
}: {
  onContinue: () => void;
  onSkipToDashboard: () => void;
}) {
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setError(null);
    start(async () => {
      const res = await fetch("/api/zims/agency/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_number: whatsapp.trim() || null,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof payload.error === "string"
            ? payload.error
            : "Could not save WhatsApp number",
        );
        return;
      }
      onContinue();
    });
  }

  return (
    <div className="space-y-6 transition-opacity duration-150 ease-in-out">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Set up WhatsApp</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your WhatsApp number so Zentro can send and receive messages for
          your agency.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="onb-wa">WhatsApp number</Label>
        <Input
          id="onb-wa"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="+601X-XXXXXXX"
          autoComplete="tel"
        />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors duration-150 ease-in-out">
        You will need a Twilio account and an approved WhatsApp Business number.
        You can set this up now or later in Settings.
      </div>

      <p className="text-center text-sm">
        <a
          href={ONBOARDING_TWILIO_WHATSAPP_DOC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-indigo-600 underline-offset-2 transition-colors duration-150 ease-in-out hover:text-indigo-700 hover:underline"
        >
          How to get a WhatsApp Business number →
        </a>
      </p>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="h-11 w-full bg-indigo-600 text-base text-white transition-all duration-150 ease-in-out hover:bg-indigo-700"
        disabled={pending}
        onClick={() => save()}
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <InlineSpinner className="text-white" />
            Saving…
          </span>
        ) : (
          "Save and continue"
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => onSkipToDashboard()}
          className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-150 ease-in-out hover:text-foreground hover:underline"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
}
