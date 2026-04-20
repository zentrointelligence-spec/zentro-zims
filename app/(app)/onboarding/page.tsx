"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ZentroLogo } from "@/components/zims/logo";

import { CompletionCard } from "./components/CompletionCard";
import { Step1AgencyProfile } from "./components/Step1AgencyProfile";
import { Step2ImportData } from "./components/Step2ImportData";
import { Step3WhatsApp } from "./components/Step3WhatsApp";
import { Step4InviteTeam } from "./components/Step4InviteTeam";
import { StepProgress } from "./components/StepProgress";

const ZENTRO_USER_COOKIE = "zentro_user";

function readAgencyHintFromCookie(): string {
  if (typeof document === "undefined") return "";
  const part = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ZENTRO_USER_COOKIE}=`));
  if (!part) return "";
  try {
    const raw = decodeURIComponent(part.slice(ZENTRO_USER_COOKIE.length + 1));
    const j = JSON.parse(raw) as Record<string, unknown>;
    if (typeof j.agency_name === "string" && j.agency_name.trim()) {
      return j.agency_name.trim();
    }
  } catch {
    /* ignore */
  }
  return "";
}

function OnboardingWizardBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [showCompletion, setShowCompletion] = useState(false);
  const [cookieHint] = useState(() => readAgencyHintFromCookie());

  const initialAgencyName = useMemo(() => {
    const q = searchParams.get("agency_name")?.trim();
    if (q) return q;
    return cookieHint;
  }, [searchParams, cookieHint]);

  function goDashboard() {
    router.replace("/dashboard");
  }

  return (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto"
      style={{ backgroundColor: "#f8f7f4" }}
    >
      {currentStep >= 2 ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-4 sm:p-6">
          <button
            type="button"
            onClick={() => goDashboard()}
            className="pointer-events-auto text-sm text-muted-foreground underline-offset-4 transition-colors duration-150 ease-in-out hover:text-foreground hover:underline"
          >
            I&apos;ll finish later
          </button>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-full max-w-[560px] flex-col px-4 py-12 sm:px-6 sm:py-16">
        <div
          className="w-full rounded-2xl border border-border/60 bg-white p-10 shadow-sm transition-shadow duration-150 ease-in-out"
          style={{ minHeight: 480 }}
        >
          <div className="mb-8 flex justify-center">
            <ZentroLogo variant="dark" />
          </div>

          {showCompletion ? (
            <CompletionCard />
          ) : (
            <>
              <StepProgress currentStep={currentStep} />
              {currentStep === 1 ? (
                <Step1AgencyProfile
                  initialAgencyName={initialAgencyName}
                  onContinue={() => setCurrentStep(2)}
                />
              ) : null}
              {currentStep === 2 ? (
                <Step2ImportData
                  onContinue={() => setCurrentStep(3)}
                  onSkipToDashboard={() => goDashboard()}
                />
              ) : null}
              {currentStep === 3 ? (
                <Step3WhatsApp
                  onContinue={() => setCurrentStep(4)}
                  onSkipToDashboard={() => goDashboard()}
                />
              ) : null}
              {currentStep === 4 ? (
                <Step4InviteTeam
                  onFinishSetup={() => setShowCompletion(true)}
                  onSkipToDashboard={() => goDashboard()}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ backgroundColor: "#f8f7f4" }}
        >
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        </div>
      }
    >
      <OnboardingWizardBody />
    </Suspense>
  );
}
