"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { trackDemo } from "@/lib/analytics"
import {
  X,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Users,
  FileText,
  MessageCircle,
  CalendarClock,
  Bot,
  CheckCircle2,
  ArrowRight,
  Zap,
  TrendingUp,
  Bell,
  Search,
  Plus,
  Phone,
  Mail,
  MoreHorizontal,
  Clock,
  AlertCircle,
} from "lucide-react"

interface DemoStep {
  id: number
  title: string
  subtitle: string
  icon: React.ElementType
  screen: React.ReactNode
}

function DashboardScreen() {
  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-xs font-bold text-white">Z</div>
          <span className="text-xs font-medium text-white">Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 items-center gap-1 rounded-lg bg-white/5 px-2 text-[10px] text-slate-400">
            <Search className="h-3 w-3" /> Search...
          </div>
          <Bell className="h-4 w-4 text-slate-400" />
        </div>
      </div>
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-2 p-3">
        {[
          { label: "Leads", val: "1,247", change: "+12%", color: "text-brand-400", bg: "bg-brand-500/10" },
          { label: "Policies", val: "892", change: "+5%", color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Renewals", val: "24", change: "Due", color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Premium", val: "$48K", change: "+8.4%", color: "text-violet-400", bg: "bg-violet-500/10" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-white/5 bg-white/5 p-2.5">
            <p className="text-[9px] text-slate-400">{kpi.label}</p>
            <p className="text-sm font-bold text-white">{kpi.val}</p>
            <span className={`text-[8px] ${kpi.color}`}>{kpi.change}</span>
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="mx-3 mb-3 rounded-lg border border-white/5 bg-white/5 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-white">Premium Trends</span>
          <TrendingUp className="h-3 w-3 text-brand-400" />
        </div>
        <div className="flex items-end gap-[2px] h-16">
          {[35, 55, 42, 68, 52, 78, 65, 88, 72, 95, 84, 100].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="flex-1 rounded-t bg-brand-500/30"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function LeadsScreen() {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setStage((s) => (s + 1) % 4), 2000)
    return () => clearInterval(interval)
  }, [])

  const stages = ["New", "Contacted", "Quoted", "Closed"]
  const leads = [
    { name: "Ahmad Ibrahim", email: "ahmad@email.com", avatar: "AI", color: "bg-emerald-500", stage: 0 },
    { name: "Sarah Tan", email: "sarah@email.com", avatar: "ST", color: "bg-blue-500", stage: 1 },
    { name: "Raj Kumar", email: "raj@email.com", avatar: "RK", color: "bg-violet-500", stage: 2 },
    { name: "Lisa Wong", email: "lisa@email.com", avatar: "LW", color: "bg-amber-500", stage: 3 },
  ]

  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-400" />
          <span className="text-xs font-medium text-white">Lead Pipeline</span>
        </div>
        <button className="flex items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-[10px] text-white">
          <Plus className="h-3 w-3" /> Add Lead
        </button>
      </div>
      <div className="p-3">
        <div className="flex gap-1 mb-3">
          {stages.map((s, i) => (
            <div key={s} className={`flex-1 rounded-md py-1 text-center text-[9px] font-medium transition-colors ${stage === i ? "bg-white/10 text-white" : "text-slate-500"}`}>
              {s} ({leads.filter((l) => l.stage === i).length})
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {leads.map((lead, i) => (
            <motion.div
              key={lead.name}
              animate={{ x: lead.stage * 8 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 p-2"
            >
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-bold text-white ${lead.color}`}>{lead.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-white truncate">{lead.name}</p>
                <p className="text-[8px] text-slate-400">{lead.email}</p>
              </div>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[8px] text-slate-300">{stages[lead.stage]}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PolicyScreen() {
  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-medium text-white">Policy #2847</span>
        </div>
        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] text-amber-400">Expires in 7 days</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-white">Life Insurance - Whole Life</p>
            <p className="text-[10px] text-slate-400">Ahmad Ibrahim · RM 2,400/year</p>
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/5 p-3 space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400">Start Date</span>
            <span className="text-white">Jan 15, 2024</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400">End Date</span>
            <span className="text-amber-400">Jan 14, 2026</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400">Premium</span>
            <span className="text-white">RM 2,400</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 rounded-lg bg-brand-600 py-2 text-[10px] font-medium text-white">Create Renewal</button>
          <button className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-[10px] text-slate-300">View Details</button>
        </div>
      </div>
    </div>
  )
}

function WhatsAppScreen() {
  const messages = [
    { from: "me", text: "Hi Sarah, your policy renewal is due next week. Would you like to schedule a call?", time: "10:30 AM" },
    { from: "them", text: "Yes, Tuesday 2pm works for me!", time: "10:35 AM" },
    { from: "me", text: "Perfect, I've booked it in. See you then!", time: "10:36 AM" },
  ]

  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-sm flex flex-col">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <MessageCircle className="h-4 w-4 text-emerald-400" />
        <div>
          <p className="text-xs font-medium text-white">Sarah Tan</p>
          <p className="text-[8px] text-emerald-400">Online</p>
        </div>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-hidden">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.5 }}
            className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 ${msg.from === "me" ? "bg-brand-600" : "bg-white/10"}`}>
              <p className="text-[10px] text-white">{msg.text}</p>
              <p className="text-[7px] text-slate-400 mt-0.5">{msg.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="border-t border-white/5 p-2">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5">
          <span className="text-[10px] text-slate-500 flex-1">Type a message...</span>
          <Zap className="h-3 w-3 text-brand-400" />
        </div>
      </div>
    </div>
  )
}

function RenewalScreen() {
  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-medium text-white">Renewal Automation</span>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] text-emerald-400">Auto-enabled</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-medium text-white">3 policies expire this month</p>
            <p className="text-[9px] text-slate-400">Auto-reminders scheduled</p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { name: "Ahmad Ibrahim", days: "7 days", status: "Reminder sent" },
            { name: "Lisa Wong", days: "14 days", status: "Queued" },
            { name: "Raj Kumar", days: "21 days", status: "Queued" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 p-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-white/10" />
                <div>
                  <p className="text-[10px] text-white">{item.name}</p>
                  <p className="text-[8px] text-slate-400">Expires in {item.days}</p>
                </div>
              </div>
              <span className="text-[8px] text-emerald-400">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AIScreen() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % 4), 1500)
    return () => clearInterval(interval)
  }, [])

  const prompts = [
    "Generate a renewal reminder for Ahmad...",
    "Analyzing policy history...",
    "Writing personalized message...",
    "Done! Message copied to WhatsApp",
  ]

  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <Bot className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-medium text-white">Zentro AI Assistant</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-3 w-3 text-brand-400" />
            <span className="text-[10px] text-slate-300">AI Prompt</span>
          </div>
          <motion.p
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-white"
          >
            {prompts[step]}
          </motion.p>
        </div>
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
          <p className="text-[10px] text-violet-300 mb-2">Suggested message:</p>
          <p className="text-[10px] text-white leading-relaxed">
            Hi Ahmad, hope you're doing well! Your Life Insurance policy (#2847) is due for renewal on Jan 14. 
            Would you like to review your coverage? I'm here to help! — Sarah, Chen Insurance
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 rounded-lg bg-brand-600 py-2 text-[10px] text-white">Send via WhatsApp</button>
          <button className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-[10px] text-slate-300">Copy Text</button>
        </div>
      </div>
    </div>
  )
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    title: "Dashboard Overview",
    subtitle: "See everything at a glance — leads, policies, renewals, and revenue",
    icon: Zap,
    screen: <DashboardScreen />,
  },
  {
    id: 2,
    title: "Lead Pipeline",
    subtitle: "Track every prospect from first contact to closed deal",
    icon: Users,
    screen: <LeadsScreen />,
  },
  {
    id: 3,
    title: "Policy Management",
    subtitle: "Never miss an expiry with automatic renewal alerts",
    icon: FileText,
    screen: <PolicyScreen />,
  },
  {
    id: 4,
    title: "WhatsApp Integration",
    subtitle: "Chat with clients directly — no switching apps",
    icon: MessageCircle,
    screen: <WhatsAppScreen />,
  },
  {
    id: 5,
    title: "Renewal Automation",
    subtitle: "Auto-flag expiring policies and send reminders",
    icon: CalendarClock,
    screen: <RenewalScreen />,
  },
  {
    id: 6,
    title: "AI Assistant",
    subtitle: "Generate messages, replies, and renewal content instantly",
    icon: Bot,
    screen: <AIScreen />,
  },
]

export function DemoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = (prev + 1) % DEMO_STEPS.length
      trackDemo("step_change", next)
      return next
    })
    setProgress(0)
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => (prev - 1 + DEMO_STEPS.length) % DEMO_STEPS.length)
    setProgress(0)
  }, [])

  // Auto-play
  useEffect(() => {
    if (!isOpen || !isPlaying) return
    const duration = 4000 // 4 seconds per step
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextStep()
          return 0
        }
        return prev + 100 / (duration / 50)
      })
    }, 50)
    return () => clearInterval(interval)
  }, [isOpen, isPlaying, nextStep])

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setProgress(0)
      setIsPlaying(true)
      trackDemo("play")
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextStep()
      if (e.key === "ArrowLeft") prevStep()
      if (e.key === "Escape") onClose()
      if (e.key === " ") {
        e.preventDefault()
        setIsPlaying((p) => !p)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, nextStep, prevStep, onClose])

  const step = DEMO_STEPS[currentStep]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e1a] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-bold text-white">
                  Z
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Product Demo</p>
                  <p className="text-[10px] text-slate-400">
                    Step {currentStep + 1} of {DEMO_STEPS.length}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-500 to-violet-500"
                animate={{ width: `${((currentStep + progress / 100) / DEMO_STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 gap-0 md:grid-cols-5">
              {/* Steps sidebar */}
              <div className="border-b border-white/5 p-4 md:border-b-0 md:border-r">
                <div className="space-y-1">
                  {DEMO_STEPS.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setCurrentStep(i)
                        setProgress(0)
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                        i === currentStep
                          ? "bg-white/5 text-white"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          i === currentStep
                            ? "bg-brand-600 text-white"
                            : i < currentStep
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-white/5 text-slate-500"
                        }`}
                      >
                        {i < currentStep ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                      </div>
                      <span className="text-[11px] font-medium">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen preview */}
              <div className="col-span-4 p-4 md:p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                      <p className="text-sm text-slate-400">{step.subtitle}</p>
                    </div>
                    <div className="aspect-[4/3] max-h-[360px]">{step.screen}</div>
                  </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying((p) => !p)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white transition-colors hover:bg-white/10"
                    >
                      {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <button
                    onClick={nextStep}
                    className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-xs text-white transition-colors hover:bg-brand-700"
                  >
                    {currentStep === DEMO_STEPS.length - 1 ? "Restart" : "Next"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
