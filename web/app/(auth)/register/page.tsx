import Link from "next/link";

import { RegisterForm } from "./register-form";

export const metadata = { title: "Create workspace" };

export default function RegisterPage() {
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
          Create your account
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Set up your agency in under 2 minutes
        </p>
      </div>
      <RegisterForm />
      <p className="mt-6 text-center text-[13px] text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
