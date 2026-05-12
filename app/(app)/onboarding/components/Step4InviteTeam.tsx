"use client";

import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineSpinner } from "@/components/zims/loading-spinner";
import { CreateUserSchema } from "@/lib/schemas";

export function Step4InviteTeam({
  onFinishSetup,
  onSkipToDashboard,
}: {
  onFinishSetup: () => void;
  onSkipToDashboard: () => void;
}) {
  const baseId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invited, setInvited] = useState(false);
  const [pending, start] = useTransition();

  function sendInvite() {
    setError(null);
    const parsed = CreateUserSchema.safeParse({
      name,
      email,
      password,
      role: "agent" as const,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(first?.message ?? "Check the form and try again.");
      return;
    }
    start(async () => {
      const res = await fetch("/api/zims/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof payload.error === "string"
            ? payload.error
            : "Could not invite user",
        );
        return;
      }
      setInvited(true);
      setName("");
      setEmail("");
      setPassword("");
    });
  }

  return (
    <div className="space-y-6 transition-opacity duration-150 ease-in-out">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Invite your first agent
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your team so they can start managing leads and policies.
        </p>
      </div>

      {invited ? (
        <div
          className="inline-flex items-center rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium transition-all duration-150 ease-in-out"
          style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
        >
          ✓ Agent invited
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${baseId}-name`}>Name</Label>
        <Input
          id={`${baseId}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${baseId}-email`}>Email</Label>
        <Input
          id={`${baseId}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="agent@agency.com"
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${baseId}-pw`}>Password</Label>
        <div className="flex gap-2">
          <Input
            id={`${baseId}-pw`}
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0 transition-all duration-150 ease-in-out"
            onClick={() => setShowPw((v) => !v)}
          >
            {showPw ? "Hide" : "Show"}
          </Button>
        </div>
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
        onClick={() => sendInvite()}
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <InlineSpinner className="text-white" />
            Sending…
          </span>
        ) : (
          "Send invite"
        )}
      </Button>

      {invited ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="h-11 flex-1 transition-all duration-150 ease-in-out"
            onClick={() => {
              setInvited(false);
              setError(null);
            }}
          >
            Invite another
          </Button>
          <Button
            type="button"
            className="h-11 flex-1 bg-indigo-600 text-white transition-all duration-150 ease-in-out hover:bg-indigo-700"
            onClick={() => onFinishSetup()}
          >
            Finish setup
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full transition-all duration-150 ease-in-out"
          onClick={() => onFinishSetup()}
        >
          Finish setup
        </Button>
      )}

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
