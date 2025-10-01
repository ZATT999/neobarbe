export interface WhatsAppNotification {
  to: string
  message: string
  type: "booking" | "cancellation" | "reminder"
  appointmentId?: string
  timestamp: string
}

export const WHATSAPP_CONFIG = {
  ADMIN_PHONE: "573015378286", // WhatsApp number with country code (Colombia +57)
  ENABLED: true,
}

export function formatWhatsAppPhone(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, "")

  // Add 57 prefix for Colombian numbers if not present
  if (cleaned.length === 10 && !cleaned.startsWith("57")) {
    return `57${cleaned}`
  }

  if (cleaned.length === 12 && cleaned.startsWith("57")) {
    return cleaned
  }

  return phone.replace(/\D/g, "")
}

export function createWhatsAppBookingMessage(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  price: number,
): string {
  const formattedDate = new Date(date).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return `🔔 *NUEVA CITA AGENDADA*

👤 *Cliente:* ${customerName}
✂️ *Servicio:* ${service}
📅 *Fecha:* ${formattedDate}
⏰ *Hora:* ${time}
💰 *Precio:* $${price.toLocaleString("es-CO")} COP
📱 *Teléfono:* ${customerPhone}

_NEA BARBER - Sistema de Reservas_`
}

export function createWhatsAppCancellationMessage(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  reason?: string,
): string {
  const formattedDate = new Date(date).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return `❌ *CITA CANCELADA*

👤 *Cliente:* ${customerName}
✂️ *Servicio:* ${service}
📅 *Fecha:* ${formattedDate}
⏰ *Hora:* ${time}
📱 *Teléfono:* ${customerPhone}
${reason ? `📝 *Motivo:* ${reason}` : ""}

_NEA BARBER - Sistema de Reservas_`
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  if (!WHATSAPP_CONFIG.ENABLED) {
    console.log("[v0] WhatsApp notifications disabled")
    return false
  }

  try {
    const formattedPhone = formatWhatsAppPhone(phone)
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`

    // Open WhatsApp in a new window (for web)
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank")
    }

    console.log("[v0] WhatsApp notification prepared:", {
      phone: formattedPhone,
      messagePreview: message.substring(0, 50) + "...",
    })

    return true
  } catch (error) {
    console.error("[v0] Error sending WhatsApp message:", error)
    return false
  }
}

export async function sendWhatsAppBookingNotification(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  price: number,
): Promise<boolean> {
  const message = createWhatsAppBookingMessage(customerName, customerPhone, service, date, time, price)
  return await sendWhatsAppMessage(WHATSAPP_CONFIG.ADMIN_PHONE, message)
}

export async function sendWhatsAppCancellationNotification(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  reason?: string,
): Promise<boolean> {
  const message = createWhatsAppCancellationMessage(customerName, customerPhone, service, date, time, reason)
  return await sendWhatsAppMessage(WHATSAPP_CONFIG.ADMIN_PHONE, message)
}

export function getWhatsAppChatUrl(phone: string, message?: string): string {
  const formattedPhone = formatWhatsAppPhone(phone)
  const encodedMessage = message ? encodeURIComponent(message) : ""
  return `https://wa.me/${formattedPhone}${message ? `?text=${encodedMessage}` : ""}`
}
