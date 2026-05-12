"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageCircle,
  Bell,
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  ChevronDown,
} from "lucide-react"

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Leads", active: false },
  { icon: FileText, label: "Policies", active: false },
  { icon: MessageCircle, label: "WhatsApp", active: false },
]

const PIPELINE_STAGES = ["New", "Contacted", "Quoted", "Closed"]

const INITIAL_LEADS = [
  { id: 1, name: "Ahmad Ibrahim", email: "ahmad@email.com", stage: 0, avatar: "AI", color: "bg-emerald-500" },
  { id: 2, name: "Sarah Tan", email: "sarah@email.com", stage: 1, avatar: "ST", color: "bg-blue-500" },
  { id: 3, name: "Raj Kumar", email: "raj@email.com", stage: 2, avatar: "RK", color: "bg-violet-500" },
]

const NOTIFICATIONS = [
  { icon: Bell, text: "New lead from website form", time: "2m ago", color: "text-brand-400" },
  { icon: Clock, text: "Policy #2847 expires in 7 days", time: "15m ago", color: "text-amber-400" },
  { icon: MessageCircle, text: "WhatsApp reply from Sarah Tan", time: "1h ago", color: "text-emerald-400" },
  { icon: CheckCircle2, text: "Renewal completed for Ahmad", time: "2h ago", color: "text-blue-400" },
]

function AnimatedCounter({ target, duration = 2, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const p = Math.min((now - start) / (duration * 1000), 1)
            const ease = 1 - Math.pow(1 - p, 3)
            setCount(Math.floor(ease * target))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

function KanbanCard({ lead, index }: { lead: (typeof INITIAL_LEADS)[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${lead.color}`}>
            {lead.avatar}
          </div>
          <div>
            <p className="text-xs font-medium text-white">{lead.name}</p>
            <p className="text-[10px] text-slate-400">{lead.email}</p>
          </div>
        </div>
        <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
          <Phone className="h-2.5 w-2.5" /> Life
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
          <Mail className="h-2.5 w-2.5" /> RM 2,400
        </span>
      </div>
    </motion.div>
  )
}

function Sparkline({ data, color = "bg-brand-500" }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-[3px] h-10">
      {data.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(h / max) * 100}%` }}
          transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={`flex-1 rounded-t ${color}`}
          style={{ opacity: 0.3 + (h / max) * 0.7 }}
        />
      ))}
    </div>
  )
}

export function AnimatedDemo() {
  const [leads, setLeads] = useState(INITIAL_LEADS)
  const [activeTab, setActiveTab] = useState(0)
  const [showNotification, setShowNotification] = useState(false)
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Simulate lead pipeline flow
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => {
      setLeads((prev) => {
        const newLeads = [...prev]
        const randomIdx = Math.floor(Math.random() * newLeads.length)
        const lead = newLeads[randomIdx]
        if (lead.stage < 3) {
          lead.stage += 1
        } else {
          lead.stage = 0
        }
        return [...newLeads]
      })
    }, 3500)
    return () => clearInterval(interval)
  }, [isInView])

  // Simulate notifications
  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => {
      setShowNotification(true)
      setCurrentNotifIndex((prev) => (prev + 1) % NOTIFICATIONS.length)
      setTimeout(() => setShowNotification(false), 3000)
    }, 5000)
    return () => clearInterval(interval)
  }, [isInView])

  const chartData = [35, 55, 42, 68, 52, 78, 65, 88, 72, 95, 84, 100]
  const renewalData = [12, 18, 15, 22, 28, 35, 30, 42, 38, 45, 50, 55]

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto mt-16 max-w-5xl lg:mt-20"
    >
      {/* Browser chrome */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-2xl shadow-black/30 ring-1 ring-white/5 backdrop-blur-xl">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400/80" />
            <div className="h-3 w-3 rounded-full bg-amber-400/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400">
            <Search className="h-3 w-3" />
            app.zentro.io/dashboard
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="h-4 w-4 text-slate-400" />
              <AnimatePresence>
                {showNotification && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-500"
                  />
                )}
              </AnimatePresence>
            </div>
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-500 to-violet-500" />
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="hidden w-14 flex-col items-center gap-1 border-r border-white/5 py-3 lg:flex">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 text-xs font-bold text-white">
              Z
            </div>
            {SIDEBAR_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                  item.active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <item.icon className="h-4 w-4" />
              </motion.div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 lg:p-5">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Dashboard</h3>
                <p className="text-xs text-slate-400">Welcome back, your pipeline is active</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Lead
              </motion.button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[
                { label: "Total Leads", value: 1247, change: "+12%", up: true, icon: Users, color: "text-brand-400", bg: "bg-brand-500/10" },
                { label: "Active Policies", value: 892, change: "+5%", up: true, icon: FileText, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Renewals Due", value: 24, change: "3 urgent", up: false, icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10" },
                { label: "Premium (YTD)", value: 48600, change: "+8.4%", up: true, icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10", prefix: "$" },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
                  className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400">{kpi.label}</p>
                    <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  </div>
                  <p className="mt-1 text-lg font-bold text-white">
                    {kpi.prefix}
                    <AnimatedCounter target={kpi.value} duration={1.5} />
                  </p>
                  <span className={`mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium ${kpi.up ? "text-emerald-400" : "text-amber-400"}`}>
                    <ArrowUpRight className={`h-2.5 w-2.5 ${!kpi.up && "rotate-90"}`} />
                    {kpi.change}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Charts + Activity */}
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
              {/* Premium Chart */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="col-span-2 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-white">Premium Trends</p>
                    <p className="text-[10px] text-slate-400">Monthly premium collection</p>
                  </div>
                  <div className="flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-[10px] text-slate-300">
                    <Calendar className="h-3 w-3" /> 2026
                    <ChevronDown className="h-3 w-3" />
                  </div>
                </div>
                <Sparkline data={chartData} color="bg-brand-500" />
                <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </motion.div>

              {/* Activity Feed */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="text-xs font-medium text-white mb-3">Recent Activity</p>
                <div className="space-y-2.5">
                  {NOTIFICATIONS.map((notif, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5`}>
                        <notif.icon className={`h-3 w-3 ${notif.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] leading-tight text-slate-300">{notif.text}</p>
                        <p className="text-[9px] text-slate-500">{notif.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Pipeline Kanban */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mt-3 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-white">Lead Pipeline</p>
                <div className="flex gap-1">
                  {PIPELINE_STAGES.map((stage, i) => (
                    <button
                      key={stage}
                      onClick={() => setActiveTab(i)}
                      className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                        activeTab === i ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {PIPELINE_STAGES.map((stage, stageIdx) => (
                  <div key={stage} className="rounded-lg bg-white/[0.02] p-2">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <span className="text-[10px] font-medium text-slate-400">{stage}</span>
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {leads.filter((l) => l.stage === stageIdx).length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <AnimatePresence mode="popLayout">
                        {leads
                          .filter((l) => l.stage === stageIdx)
                          .map((lead, i) => (
                            <KanbanCard key={lead.id} lead={lead} index={i} />
                          ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Renewal Forecast */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="mt-3 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-medium text-white">Renewal Forecast</p>
                  <p className="text-[10px] text-slate-400">AI-predicted renewals for next quarter</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  98% accuracy
                </span>
              </div>
              <Sparkline data={renewalData} color="bg-emerald-500" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating notification toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-2.5 rounded-xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur-md"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
              {(() => {
                const NotifIcon = NOTIFICATIONS[currentNotifIndex].icon
                return <NotifIcon className={`h-4 w-4 ${NOTIFICATIONS[currentNotifIndex].color}`} />
              })()}
            </div>
            <div>
              <p className="text-xs font-medium text-white">{NOTIFICATIONS[currentNotifIndex].text}</p>
              <p className="text-[10px] text-slate-400">{NOTIFICATIONS[currentNotifIndex].time}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
