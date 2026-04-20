import { Suspense } from "react";

import { LoginPageContent } from "./login-page-content";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-[320px]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
