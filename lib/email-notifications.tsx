export interface EmailNotification {
  to: string
  subject: string
  html: string
  text: string
  type: "booking" | "cancellation" | "reminder"
  appointmentId?: string
  timestamp: string
}

export const EMAIL_CONFIG = {
  ADMIN_EMAIL: "neabarber@gmail.com", // Email to receive notifications
  FROM_EMAIL: process.env.EMAIL_FROM || "noreply@neabarber.com",
  ENABLED: true,
}

export function createBookingEmailNotification(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  price: number,
): EmailNotification {
  const formattedDate = new Date(date).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const subject = `🔔 Nueva Cita Agendada - ${customerName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .detail { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .label { font-weight: bold; color: #1e40af; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✂️ NEA BARBER</h1>
          <h2>Nueva Cita Agendada</h2>
        </div>
        <div class="content">
          <div class="detail">
            <span class="label">Cliente:</span> ${customerName}
          </div>
          <div class="detail">
            <span class="label">Servicio:</span> ${service}
          </div>
          <div class="detail">
            <span class="label">Fecha:</span> ${formattedDate}
          </div>
          <div class="detail">
            <span class="label">Hora:</span> ${time}
          </div>
          <div class="detail">
            <span class="label">Precio:</span> $${price.toLocaleString("es-CO")} COP
          </div>
          <div class="detail">
            <span class="label">Teléfono:</span> ${customerPhone}
          </div>
        </div>
        <div class="footer">
          <p>Este correo fue generado automáticamente por el sistema de reservas de NEA BARBER</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
🔔 NUEVA CITA AGENDADA - NEA BARBER

Cliente: ${customerName}
Servicio: ${service}
Fecha: ${formattedDate}
Hora: ${time}
Precio: $${price.toLocaleString("es-CO")} COP
Teléfono: ${customerPhone}

Este correo fue generado automáticamente por el sistema de reservas.
  `

  return {
    to: EMAIL_CONFIG.ADMIN_EMAIL,
    subject,
    html,
    text,
    type: "booking",
    timestamp: new Date().toISOString(),
  }
}

export function createCancellationEmailNotification(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  reason?: string,
): EmailNotification {
  const formattedDate = new Date(date).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const subject = `❌ Cita Cancelada - ${customerName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #fef2f2; padding: 20px; border-radius: 0 0 8px 8px; }
        .detail { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .label { font-weight: bold; color: #991b1b; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✂️ NEA BARBER</h1>
          <h2>Cita Cancelada</h2>
        </div>
        <div class="content">
          <div class="detail">
            <span class="label">Cliente:</span> ${customerName}
          </div>
          <div class="detail">
            <span class="label">Servicio:</span> ${service}
          </div>
          <div class="detail">
            <span class="label">Fecha:</span> ${formattedDate}
          </div>
          <div class="detail">
            <span class="label">Hora:</span> ${time}
          </div>
          <div class="detail">
            <span class="label">Teléfono:</span> ${customerPhone}
          </div>
          ${reason ? `<div class="detail"><span class="label">Motivo:</span> ${reason}</div>` : ""}
        </div>
        <div class="footer">
          <p>Este correo fue generado automáticamente por el sistema de reservas de NEA BARBER</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
❌ CITA CANCELADA - NEA BARBER

Cliente: ${customerName}
Servicio: ${service}
Fecha: ${formattedDate}
Hora: ${time}
Teléfono: ${customerPhone}
${reason ? `Motivo: ${reason}` : ""}

Este correo fue generado automáticamente por el sistema de reservas.
  `

  return {
    to: EMAIL_CONFIG.ADMIN_EMAIL,
    subject,
    html,
    text,
    type: "cancellation",
    timestamp: new Date().toISOString(),
  }
}

export async function sendBookingEmailNotification(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  price: number,
): Promise<boolean> {
  try {
    const notification = createBookingEmailNotification(customerName, customerPhone, service, date, time, price)

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    })

    if (!response.ok) {
      console.error("[v0] Failed to send booking email:", await response.text())
      return false
    }

    console.log("[v0] Booking email sent successfully")
    return true
  } catch (error) {
    console.error("[v0] Error sending booking email:", error)
    return false
  }
}

export async function sendCancellationEmailNotification(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  reason?: string,
): Promise<boolean> {
  try {
    const notification = createCancellationEmailNotification(customerName, customerPhone, service, date, time, reason)

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    })

    if (!response.ok) {
      console.error("[v0] Failed to send cancellation email:", await response.text())
      return false
    }

    console.log("[v0] Cancellation email sent successfully")
    return true
  } catch (error) {
    console.error("[v0] Error sending cancellation email:", error)
    return false
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
