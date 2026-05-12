"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { z } from "zod"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { scaleIn } from "@/lib/motion-config"
import { LeadCreatePayload } from "@/lib/schemas"
import { cn } from "@/lib/utils"

type FormInput = z.input<typeof LeadCreatePayload>
type FormOutput = z.output<typeof LeadCreatePayload>

export function LeadCreateModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormOutput) => Promise<void> | void
}) {
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(LeadCreatePayload),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      insurance_type: "",
      source: "",
      notes: "",
      status: "new",
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = form

  async function handleFormSubmit(values: FormOutput) {
    setLoading(true)
    try {
      await onSubmit(values)
      reset()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  function onError() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const insuranceType = watch("insurance_type")
  const source = watch("source")

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-full max-w-[calc(100%-1rem)] sm:max-w-2xl">
        <motion.div
          initial={scaleIn.initial}
          animate={scaleIn.animate}
          exit={scaleIn.exit}
          transition={scaleIn.transition}
        >
          <DialogHeader>
            <DialogTitle>Create Lead</DialogTitle>
            <DialogDescription>
              Add a new prospect to your pipeline.
            </DialogDescription>
          </DialogHeader>

          <motion.form
            animate={shake ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit(handleFormSubmit, onError)}
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {/* Left column - basic info */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="lead-name">Name *</Label>
                <Input
                  id="lead-name"
                  placeholder="Jane Doe"
                  {...register("name")}
                  className={cn(errors.name && "border-red-300")}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lead-phone">Phone *</Label>
                <Input
                  id="lead-phone"
                  placeholder="+1 555 0100"
                  {...register("phone")}
                  className={cn(errors.phone && "border-red-300")}
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="jane@example.com"
                  {...register("email")}
                  className={cn(errors.email && "border-red-300")}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Right column - details */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="lead-insurance">Insurance Type *</Label>
                <Select
                  value={insuranceType || "placeholder"}
                  onValueChange={(v) =>
                    setValue("insurance_type", v === "placeholder" ? "" : (v || ""), {
                      shouldValidate: true,
                    })
                  }
                  disabled={loading}
                >
                  <SelectTrigger
                    id="lead-insurance"
                    className={cn(
                      "w-full",
                      errors.insurance_type && "border-red-300",
                    )}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled>
                      Select type
                    </SelectItem>
                    {["motor", "life", "health", "home", "travel"].map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.insurance_type && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.insurance_type.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="lead-source">Source</Label>
                <Select
                  value={source || "placeholder"}
                  onValueChange={(v) =>
                    setValue("source", v === "placeholder" ? "" : (v || ""), {
                      shouldValidate: true,
                    })
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="lead-source" className="w-full">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled>
                      Select source
                    </SelectItem>
                    {["web", "referral", "walk_in", "social", "other"].map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lead-tags">Tags</Label>
                <Input
                  id="lead-tags"
                  placeholder="hot, renewals, vip"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="lead-agent">Assigned Agent</Label>
                <Select disabled={loading}>
                  <SelectTrigger id="lead-agent" className="w-full">
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled>
                      Select agent
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Full width notes */}
            <div className="sm:col-span-2">
              <Label htmlFor="lead-notes">Notes</Label>
              <Input
                id="lead-notes"
                placeholder="Optional context about this lead"
                {...register("notes")}
                disabled={loading}
              />
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Lead"
                )}
              </Button>
            </DialogFooter>
          </motion.form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
