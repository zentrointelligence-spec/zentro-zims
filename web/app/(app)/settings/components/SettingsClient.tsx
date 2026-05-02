"use client";

import { PageHeader } from "@/components/zims/page-header";
import type { AgencySettings } from "@/lib/schemas";

import { AgencyProfileForm } from "./AgencyProfileForm";
import { NotificationTemplatesForm } from "./NotificationTemplatesForm";
import { RenewalSettingsForm } from "./RenewalSettingsForm";

export function SettingsClient({ settings }: { settings: AgencySettings }) {
  return (
    <div className="mx-auto w-full max-w-[680px] space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your agency configuration"
      />
      <div className="flex flex-col gap-6">
        <AgencyProfileForm settings={settings} />
        <RenewalSettingsForm settings={settings} />
        <NotificationTemplatesForm settings={settings} />
      </div>
    </div>
  );
}
