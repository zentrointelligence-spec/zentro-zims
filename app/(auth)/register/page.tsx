import Link from "next/link";

import { RegisterForm } from "./register-form";

export const metadata = { title: "Create workspace" };

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your Zentro workspace
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Spin up an agency in 30 seconds. You&apos;ll be the first admin.
        </p>
      </div>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
