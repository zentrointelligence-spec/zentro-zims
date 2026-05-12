import {
  Bot,
  CalendarClock,
  FileSpreadsheet,
  MessageCircle,
  Target,
  Wallet,
} from "lucide-react";

const FEATURES = [
  {
    title: "Lead Management",
    description:
      "Capture, track, and qualify leads from any source. Never lose a prospect again.",
    icon: Target,
  },
  {
    title: "Policy Tracking",
    description:
      "All your policies in one place with automatic expiry tracking and renewal alerts.",
    icon: Wallet,
  },
  {
    title: "Renewal Automation",
    description:
      "Auto-flag policies expiring in 30 days. Create renewal tasks automatically. Never miss a renewal.",
    icon: CalendarClock,
  },
  {
    title: "WhatsApp Integration",
    description:
      "Send messages, receive replies, and log every conversation — all inside Zentro.",
    icon: MessageCircle,
  },
  {
    title: "AI Assistant",
    description:
      "Get AI-generated reply suggestions, renewal messages, and birthday wishes in seconds.",
    icon: Bot,
  },
  {
    title: "Excel Import",
    description:
      "Bring your existing data in minutes. Upload your spreadsheet and Zentro handles the rest.",
    icon: FileSpreadsheet,
  },
] as const;

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="border-b border-white/5 bg-transparent px-4 py-16 sm:px-6 md:py-24"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[28px] font-bold tracking-[-0.02em] text-white md:text-4xl">
            Everything your agency needs
          </h2>
          <p className="mt-4 text-base leading-[1.7] text-slate-400">
            Built specifically for how insurance agencies actually work
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-xl border border-white/10 bg-slate-900/30 p-6 shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-white/20 backdrop-blur-sm"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <f.icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="text-lg font-bold tracking-[-0.02em] text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-base leading-[1.7] text-gray-500">{f.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
