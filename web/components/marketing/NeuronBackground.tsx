"use client"

import { useEffect, useRef } from "react"

interface Neuron {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseRadius: number
  pulsePhase: number
  pulseSpeed: number
  brightness: number
  layer: number
  connections: number[]
}

export function NeuronBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000, active: false })

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    let raf: number
    let time = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = window.innerWidth + "px"
      canvas.style.height = window.innerHeight + "px"
    }
    resize()
    window.addEventListener("resize", resize)

    const NEURON_COUNT = 100
    const CONNECTION_DISTANCE = 150
    const MOUSE_RADIUS = 180

    const neurons: Neuron[] = Array.from({ length: NEURON_COUNT }, (_, i) => {
      const layer = i < NEURON_COUNT * 0.35 ? 0 : i < NEURON_COUNT * 0.7 ? 1 : 2
      const baseRadius = layer === 2 ? 2.2 : layer === 1 ? 1.8 : 1.2
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * (layer === 2 ? 0.2 : layer === 1 ? 0.35 : 0.55),
        vy: (Math.random() - 0.5) * (layer === 2 ? 0.2 : layer === 1 ? 0.35 : 0.55),
        radius: baseRadius,
        baseRadius,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.5 + Math.random() * 1.5,
        brightness: 0.25 + Math.random() * 0.35,
        layer,
        connections: [],
      }
    })

    const computeConnections = () => {
      neurons.forEach((n, i) => {
        n.connections = []
        neurons.forEach((other, j) => {
          if (i === j) return
          const dx = n.x - other.x
          const dy = n.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECTION_DISTANCE && n.connections.length < 4) {
            n.connections.push(j)
          }
        })
      })
    }
    computeConnections()

    const activePulses: { from: number; to: number; progress: number; speed: number; color: string }[] = []
    let lastPulseTime = 0

    const spawnPulse = () => {
      const fromIdx = Math.floor(Math.random() * neurons.length)
      const neuron = neurons[fromIdx]
      if (neuron.connections.length === 0) return
      const toIdx = neuron.connections[Math.floor(Math.random() * neuron.connections.length)]
      const colors = [
        "147, 92, 255",
        "99, 102, 241",
        "6, 182, 212",
        "168, 85, 247",
        "139, 92, 246",
      ]
      activePulses.push({
        from: fromIdx,
        to: toIdx,
        progress: 0,
        speed: 0.01 + Math.random() * 0.015,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      mouseRef.current.active = true
    }
    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseleave", handleMouseLeave)

    const draw = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      time += 0.016

      // Deep dark background
      ctx.fillStyle = "#0a0e1a"
      ctx.fillRect(0, 0, width, height)

      // Subtle center glow
      const centerGlow = ctx.createRadialGradient(width * 0.5, height * 0.25, 0, width * 0.5, height * 0.25, width * 0.5)
      centerGlow.addColorStop(0, "rgba(99, 102, 241, 0.04)")
      centerGlow.addColorStop(0.5, "rgba(124, 92, 252, 0.02)")
      centerGlow.addColorStop(1, "transparent")
      ctx.fillStyle = centerGlow
      ctx.fillRect(0, 0, width, height)

      if (Math.floor(time * 60) % 60 === 0) {
        computeConnections()
      }

      const mouse = mouseRef.current

      // Update positions
      neurons.forEach((n) => {
        n.x += n.vx
        n.y += n.vy

        if (n.x < -30) { n.x = -30; n.vx *= -1 }
        if (n.x > width + 30) { n.x = width + 30; n.vx *= -1 }
        if (n.y < -30) { n.y = -30; n.vy *= -1 }
        if (n.y > height + 30) { n.y = height + 30; n.vy *= -1 }

        if (mouse.active) {
          const dx = n.x - mouse.x
          const dy = n.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_RADIUS && dist > 1) {
            const force = (1 - dist / MOUSE_RADIUS) * 0.6
            n.vx += (dx / dist) * force
            n.vy += (dy / dist) * force
          }
        }

        n.vx *= 0.996
        n.vy *= 0.996

        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy)
        const minSpeed = n.layer === 2 ? 0.04 : n.layer === 1 ? 0.08 : 0.12
        if (speed < minSpeed) {
          n.vx += (Math.random() - 0.5) * 0.015
          n.vy += (Math.random() - 0.5) * 0.015
        }

        n.pulsePhase += n.pulseSpeed * 0.016
        n.radius = n.baseRadius + Math.sin(n.pulsePhase) * 0.6
      })

      // Spawn pulses
      if (time - lastPulseTime > 0.2 + Math.random() * 0.4) {
        spawnPulse()
        lastPulseTime = time
      }

      // Draw synapses (connections)
      ctx.lineCap = "round"
      neurons.forEach((n, i) => {
        n.connections.forEach((j) => {
          if (j <= i) return
          const other = neurons[j]
          const dx = n.x - other.x
          const dy = n.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const opacity = Math.max(0, (1 - dist / CONNECTION_DISTANCE) * 0.12)

          ctx.beginPath()
          ctx.moveTo(n.x, n.y)
          ctx.lineTo(other.x, other.y)
          ctx.strokeStyle = `rgba(147, 92, 255, ${opacity})`
          ctx.lineWidth = 0.4
          ctx.stroke()
        })
      })

      // Draw traveling pulses
      for (let p = activePulses.length - 1; p >= 0; p--) {
        const pulse = activePulses[p]
        pulse.progress += pulse.speed

        if (pulse.progress >= 1) {
          activePulses.splice(p, 1)
          continue
        }

        const from = neurons[pulse.from]
        const to = neurons[pulse.to]
        const x = from.x + (to.x - from.x) * pulse.progress
        const y = from.y + (to.y - from.y) * pulse.progress

        const glow = ctx.createRadialGradient(x, y, 0, x, y, 10)
        glow.addColorStop(0, `rgba(${pulse.color}, ${0.7 * (1 - pulse.progress)})`)
        glow.addColorStop(1, `rgba(${pulse.color}, 0)`)
        ctx.fillStyle = glow
        ctx.fillRect(x - 10, y - 10, 20, 20)

        ctx.beginPath()
        ctx.arc(x, y, 1.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${pulse.color}, ${1 - pulse.progress * 0.3})`
        ctx.fill()
      }

      // Draw neuron nodes
      neurons.forEach((n) => {
        const pulseIntensity = (Math.sin(n.pulsePhase) + 1) * 0.5
        const alpha = n.brightness + pulseIntensity * 0.25

        if (n.layer >= 1) {
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 5)
          const glowAlpha = n.layer === 2 ? alpha * 0.25 : alpha * 0.12
          glow.addColorStop(0, `rgba(147, 92, 255, ${glowAlpha})`)
          glow.addColorStop(1, "transparent")
          ctx.fillStyle = glow
          ctx.fillRect(n.x - n.radius * 5, n.y - n.radius * 5, n.radius * 10, n.radius * 10)
        }

        ctx.beginPath()
        ctx.arc(n.x, n.y, Math.max(0.5, n.radius), 0, Math.PI * 2)

        if (n.layer === 2) {
          ctx.fillStyle = `rgba(200, 190, 255, ${alpha})`
        } else if (n.layer === 1) {
          ctx.fillStyle = `rgba(160, 140, 255, ${alpha * 0.8})`
        } else {
          ctx.fillStyle = `rgba(124, 92, 252, ${alpha * 0.45})`
        }
        ctx.fill()

        if (n.layer === 2 && pulseIntensity > 0.7) {
          ctx.beginPath()
          ctx.arc(n.x - n.radius * 0.3, n.y - n.radius * 0.3, n.radius * 0.35, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity * 0.5})`
          ctx.fill()
        }
      })

      // Mouse glow
      if (mouse.active) {
        const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_RADIUS)
        mouseGlow.addColorStop(0, "rgba(99, 102, 241, 0.05)")
        mouseGlow.addColorStop(0.5, "rgba(124, 92, 252, 0.02)")
        mouseGlow.addColorStop(1, "transparent")
        ctx.fillStyle = mouseGlow
        ctx.fillRect(mouse.x - MOUSE_RADIUS, mouse.y - MOUSE_RADIUS, MOUSE_RADIUS * 2, MOUSE_RADIUS * 2)
      }

      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    />
  )
}
