"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { LoginForm } from "./login-form";

export function LoginPageContent() {
  const params = useSearchParams();
  const nextParam = params.get("next");
  const reason = params.get("reason");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";
  const expired = reason === "expired";

  return (
    <div>
      <div className="mb-8 text-center md:text-left">
        <div className="mb-6 flex justify-center md:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-400 to-indigo-600 text-sm font-bold text-white">
              Z
            </span>
            <span className="text-base font-bold text-slate-900">Zentro</span>
          </Link>
        </div>
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-slate-900">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to your Zentro account
        </p>
      </div>
      {expired ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4" />
          Your session expired. Please sign in again.
        </div>
      ) : null}
      <LoginForm nextPath={next} />
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <p className="text-center text-[13px] text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Start free today
        </Link>
      </p>
    </div>
  );
}
