import { cn } from "@/lib/utils";

export function HowItWorksSection() {
  const steps = [
    {
      title: "Create your agency account",
      body: "Sign up free. No credit card needed. Your data is isolated from day one.",
    },
    {
      title: "Import your existing data",
      body: "Upload your customer and policy spreadsheet. Zentro maps the columns and imports everything automatically.",
    },
    {
      title: "Automate your follow-ups",
      body: "Renewal reminders, birthday messages, and WhatsApp replies run on autopilot so you can focus on selling.",
    },
  ] as const;

  return (
    <section
      id="how-it-works"
      className="border-b border-white/5 bg-transparent px-4 py-16 sm:px-6 md:py-24"
    >
      <div className="mx-auto max-w-[1200px]">
        <h2 className="text-center text-[28px] font-bold tracking-[-0.02em] text-white md:text-4xl">
          Up and running in minutes
        </h2>
        <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className={cn(
                "relative text-center md:text-left",
                i > 0 &&
                  "border-t border-white/10 pt-10 md:border-t-0 md:border-l md:border-white/10 md:pl-8 md:pt-0",
              )}
            >
              <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white md:mx-0">
                {i + 1}
              </span>
              <h3 className="text-lg font-bold tracking-[-0.02em] text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-base leading-[1.7] text-slate-400">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
