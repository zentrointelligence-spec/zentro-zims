'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Shield, DollarSign } from 'lucide-react'

export default function AnimationDemoPage() {
  const [count, setCount] = useState(1247)

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            ZIMS Animation Demo
          </h1>
          <p className="text-neutral-600">
            Hover, click, and interact with these components
          </p>
        </motion.div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Customers"
            value={count}
            icon={Users}
            trend={{ value: 5.2, isPositive: true }}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <KPICard
            title="Active Policies"
            value={892}
            icon={Shield}
            trend={{ value: 3.1, isPositive: true }}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <KPICard
            title="Renewals Due"
            value={24}
            icon={TrendingUp}
            trend={{ value: -2, isPositive: true }}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />
          <KPICard
            title="Premium MTD"
            value={48320}
            icon={DollarSign}
            trend={{ value: 8.4, isPositive: true }}
            iconBgColor="bg-violet-100"
            iconColor="text-violet-600"
            prefix="$"
          />
        </div>

        {/* Interactive Buttons */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Button Animations</h2>
          <div className="flex gap-4">
            <AnimatedButton onClick={() => setCount(count + 100)}>
              Primary Button
            </AnimatedButton>
            <AnimatedButton variant="outline">
              Secondary Button
            </AnimatedButton>
            <AnimatedButton variant="ghost">
              Ghost Button
            </AnimatedButton>
          </div>
        </div>

        {/* Animated Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HoverCard
            title="Lead Generation"
            description="Convert visitors into qualified leads with smart forms"
          />
          <HoverCard
            title="Policy Tracking"
            description="Never miss an expiry date with automated reminders"
          />
          <HoverCard
            title="Team Collaboration"
            description="Assign leads and share notes across your agency"
          />
        </div>

      </div>
    </div>
  )
}

// KPI Card Component
function KPICard({ title, value, icon: Icon, trend, iconBgColor, iconColor, prefix = '' }: any) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconBgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>

      <div className="space-y-1">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-mono font-semibold text-neutral-900"
        >
          {prefix}{value.toLocaleString()}
        </motion.div>
        <p className="text-sm text-neutral-500">{title}</p>
      </div>

      <div className="mt-4 flex items-center gap-1">
        <motion.span
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-sm font-medium ${
            trend.isPositive ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {trend.isPositive ? '+' : ''}{trend.value}%
        </motion.span>
        <span className="text-sm text-neutral-500">vs last month</span>
      </div>
    </motion.div>
  )
}

// Animated Button Component
function AnimatedButton({ children, variant = 'primary', onClick }: any) {
  const variants: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border-2 border-neutral-300 text-neutral-700 hover:border-neutral-400',
    ghost: 'text-neutral-700 hover:bg-neutral-100'
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${variants[variant]}`}
    >
      {children}
    </motion.button>
  )
}

// Hover Card Component
function HoverCard({ title, description }: any) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
    >
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600">{description}</p>
    </motion.div>
  )
}
