import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export interface EmailNotification {
  to: string
  subject: string
  html: string
  text: string
  type: "booking" | "cancellation" | "reminder"
  appointmentId?: string
  timestamp: string
}

const EMAIL_CONFIG = {
  ADMIN_EMAIL: "neabarber@gmail.com",
  FROM_EMAIL: process.env.EMAIL_FROM || "noreply@neabarber.com",
  ENABLED: true,
}

function createTransporter() {
  return nodemailer.createTransporter({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

async function sendEmail(notification: EmailNotification): Promise<boolean> {
  if (!EMAIL_CONFIG.ENABLED) {
    console.log("[v0] Email notifications disabled")
    return false
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log("[v0] Email credentials not configured")
    return false
  }

  try {
    const transporter = createTransporter()

    await transporter.verify()
    console.log("[v0] SMTP connection verified")

    const mailOptions = {
      from: EMAIL_CONFIG.FROM_EMAIL,
      to: notification.to,
      subject: notification.subject,
      text: notification.text,
      html: notification.html,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("[v0] Email sent successfully:", result.messageId)
    return true
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.to || !body.subject || !body.html || !body.text) {
      return NextResponse.json({ error: "Missing required fields: to, subject, html, text" }, { status: 400 })
    }

    const notification: EmailNotification = {
      to: body.to,
      subject: body.subject,
      html: body.html,
      text: body.text,
      type: body.type || "booking",
      appointmentId: body.appointmentId,
      timestamp: new Date().toISOString(),
    }

    const success = await sendEmail(notification)

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
      })
    } else {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Email API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "Email service is running",
    timestamp: new Date().toISOString(),
  })
}
