import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const waitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  source: z.string().default("landing_page"),
})

// Simple in-memory storage (replace with DB in production)
const waitlist: Array<{
  email: string
  name?: string
  company?: string
  role?: string
  source: string
  createdAt: string
}> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = waitlistSchema.parse(body)

    // Check for duplicates
    const exists = waitlist.find((entry) => entry.email === validated.email)
    if (exists) {
      return NextResponse.json(
        { success: false, message: "You're already on the waitlist!" },
        { status: 409 }
      )
    }

    const entry = {
      ...validated,
      createdAt: new Date().toISOString(),
    }

    waitlist.push(entry)

    // TODO: Send welcome email via Resend/SendGrid
    // TODO: Add to CRM/Email list (ConvertKit, Mailchimp)

    console.log("[Waitlist] New entry:", entry)

    return NextResponse.json(
      {
        success: true,
        message: "You're on the list! We'll be in touch soon.",
        position: waitlist.length,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

// For admin: get waitlist count
export async function GET() {
  return NextResponse.json({
    count: waitlist.length,
    recent: waitlist.slice(-5),
  })
}
