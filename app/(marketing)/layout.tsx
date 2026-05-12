import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/Footer";
import { MarketingNav } from "@/components/marketing/MarketingNav";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased">
      <MarketingNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
