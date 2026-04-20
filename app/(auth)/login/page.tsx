import Link from "next/link";

import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

type SearchParams = Promise<{ next?: string; reason?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/dashboard";
  const expired = sp.reason === "expired";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your Zentro workspace.
        </p>
      </div>
      {expired ? (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Your session expired. Please sign in again.
        </div>
      ) : null}
      <LoginForm nextPath={next} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Zentro?{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-600 hover:underline"
        >
          Create an agency workspace
        </Link>
      </p>
    </div>
  );
}
