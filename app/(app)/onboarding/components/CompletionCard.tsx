"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function CompletionCard() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(3);
  const done = useRef(false);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    const redirect = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      router.replace("/dashboard");
    }, 3000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-2 py-8 text-center transition-opacity duration-150 ease-in-out">
      <CheckCircle2
        className="mb-6 text-emerald-600"
        style={{ width: 48, height: 48 }}
        strokeWidth={1.75}
        aria-hidden
      />
      <h2 className="text-xl font-semibold tracking-tight">You&apos;re all set!</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your agency is ready. Let&apos;s go.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Redirecting to your dashboard in {secondsLeft}s…
      </p>
      <Button
        type="button"
        className="mt-8 h-11 w-full max-w-xs bg-indigo-600 text-base text-white transition-all duration-150 ease-in-out hover:bg-indigo-700"
        onClick={() => {
          if (done.current) return;
          done.current = true;
          router.replace("/dashboard");
        }}
      >
        Go to dashboard
      </Button>
    </div>
  );
}
