export interface SMSNotification {
  to: string
  message: string
  type: "booking" | "cancellation" | "reminder"
  appointmentId?: string
  timestamp: string
}

export const SMS_CONFIG = {
  ADMIN_PHONE: "3013782866", // Phone number to receive notifications
  ENABLED: true,
  MAX_MESSAGE_LENGTH: 160,
}

export function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, "")

  // Add +57 prefix for Colombian numbers if not present
  if (cleaned.length === 10 && !cleaned.startsWith("57")) {
    return `+57${cleaned}`
  }

  if (cleaned.length === 12 && cleaned.startsWith("57")) {
    return `+${cleaned}`
  }

  return phone
}

export function createBookingNotification(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  price: number,
): SMSNotification {
  const formattedDate = new Date(date).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const message = `🔔 NUEVA CITA AGENDADA
Cliente: ${customerName}
Servicio: ${service}
Fecha: ${formattedDate}
Hora: ${time}
Precio: $${price.toLocaleString("es-CO")}
Tel: ${customerPhone}

NEA BARBER`

  return {
    to: formatPhoneNumber(SMS_CONFIG.ADMIN_PHONE),
    message: message.substring(0, SMS_CONFIG.MAX_MESSAGE_LENGTH),
    type: "booking",
    timestamp: new Date().toISOString(),
  }
}

export function createCancellationNotification(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  reason?: string,
): SMSNotification {
  const formattedDate = new Date(date).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const message = `❌ CITA CANCELADA
Cliente: ${customerName}
Servicio: ${service}
Fecha: ${formattedDate}
Hora: ${time}
Tel: ${customerPhone}
${reason ? `Motivo: ${reason}` : ""}

NEA BARBER`

  return {
    to: formatPhoneNumber(SMS_CONFIG.ADMIN_PHONE),
    message: message.substring(0, SMS_CONFIG.MAX_MESSAGE_LENGTH),
    type: "cancellation",
    timestamp: new Date().toISOString(),
  }
}

export function createReminderNotification(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
): SMSNotification {
  const message = `🔔 RECORDATORIO DE CITA
Hola ${customerName}!
Tu cita de ${service} es mañana ${time}.
Recuerda llegar 5 min antes.

NEA BARBER
Tel: ${SMS_CONFIG.ADMIN_PHONE}`

  return {
    to: formatPhoneNumber(customerPhone),
    message: message.substring(0, SMS_CONFIG.MAX_MESSAGE_LENGTH),
    type: "reminder",
    timestamp: new Date().toISOString(),
  }
}

export async function sendSMS(notification: SMSNotification): Promise<boolean> {
  if (!SMS_CONFIG.ENABLED) {
    console.log("[v0] SMS notifications disabled")
    return false
  }

  // Mock SMS sending - replace with actual SMS service integration
  console.log("[v0] Mock SMS sent:", {
    to: notification.to,
    message: notification.message,
    type: notification.type,
    timestamp: notification.timestamp,
  })

  // Simulate successful sending
  return true
}

export async function sendBookingNotification(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  price: number,
): Promise<boolean> {
  const notification = createBookingNotification(customerName, customerPhone, service, date, time, price)

  return await sendSMS(notification)
}

export async function sendCancellationNotification(
  customerName: string,
  customerPhone: string,
  service: string,
  date: string,
  time: string,
  reason?: string,
): Promise<boolean> {
  const notification = createCancellationNotification(customerName, customerPhone, service, date, time, reason)

  return await sendSMS(notification)
}

export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "")
  return cleaned.length === 10 || (cleaned.length === 12 && cleaned.startsWith("57"))
}

export function getSMSHistory(): SMSNotification[] {
  // In production, this would fetch from database
  // For now, return empty array
  return []
}
