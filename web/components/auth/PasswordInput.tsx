"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrength?: boolean
}

export function PasswordInput({ showStrength = false, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [value, setValue] = useState("")

  const strength = calculateStrength(value)

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          {...props}
          onChange={(e) => {
            setValue(e.target.value)
            props.onChange?.(e)
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && value && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  level <= strength.level
                    ? strength.level <= 2
                      ? "bg-red-400"
                      : strength.level === 3
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-500">{strength.label}</p>
        </div>
      )}
    </div>
  )
}

function calculateStrength(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  const levels = [
    { level: 0, label: "Enter a password" },
    { level: 1, label: "Weak — add more characters" },
    { level: 2, label: "Fair — add numbers & symbols" },
    { level: 3, label: "Good — almost there" },
    { level: 4, label: "Strong password" },
  ]

  return levels[score]
}
