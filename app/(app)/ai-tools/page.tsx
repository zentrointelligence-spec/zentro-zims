import { PageHeader } from "@/components/zims/page-header";

import { AiToolsClient } from "./components/AiToolsClient";

export const metadata = { title: "AI Tools" };
export const dynamic = "force-dynamic";

export default function AiToolsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Tools"
        description="Generate premium messaging for campaigns and follow-ups"
      />
      <AiToolsClient />
    </div>
  );
}
