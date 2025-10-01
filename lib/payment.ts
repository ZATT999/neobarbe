export interface PaymentInfo {
  amount: number
  deposit: number
  nequiNumber: string
  reference?: string
  receipt?: string
  status: "pending" | "confirmed" | "failed"
  confirmedAt?: string
}

export const PAYMENT_CONFIG = {
  NEQUI_NUMBER: "3015378286",
  DEPOSIT_PERCENTAGE: 0.5,
  MIN_AMOUNT: 1000,
  MAX_AMOUNT: 200000,
  DEFAULT_HAIRCUT_PRICE: 18000,
  SERVICES: {
    CORTE_SENCILLO: { name: "Corte sencillo", price: 18000, duration: 35 },
    CORTE_CEJAS: { name: "Corte + cejas", price: 20000, duration: 45 },
    CORTE_BARBA: { name: "Corte + barba", price: 25000, duration: 50 },
    CORTE_PEINADO: { name: "Corte + peinado", price: 25000, duration: 45 },
    CORTE_COMPLETO: { name: "Corte completo", price: 28000, duration: 60 },
  },
  SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
}

export function calculateDeposit(amount: number): number {
  return Math.round(amount * PAYMENT_CONFIG.DEPOSIT_PERCENTAGE)
}

export function validatePaymentAmount(amount: number): string | null {
  if (amount < PAYMENT_CONFIG.MIN_AMOUNT) {
    return `El monto mínimo es $${PAYMENT_CONFIG.MIN_AMOUNT.toLocaleString("es-CO")} COP`
  }

  if (amount > PAYMENT_CONFIG.MAX_AMOUNT) {
    return `El monto máximo es $${PAYMENT_CONFIG.MAX_AMOUNT.toLocaleString("es-CO")} COP`
  }

  return null
}

export function validatePaymentProof(file?: File, reference?: string): string | null {
  if (!file && !reference?.trim()) {
    return "Debes subir un comprobante de pago o ingresar la referencia de transacción"
  }

  if (file) {
    if (!PAYMENT_CONFIG.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return "Solo se permiten archivos de imagen (JPG, PNG, WebP)"
    }

    if (file.size > PAYMENT_CONFIG.MAX_FILE_SIZE) {
      return "El archivo no puede ser mayor a 5MB"
    }
  }

  if (reference?.trim() && reference.trim().length < 4) {
    return "La referencia debe tener al menos 4 caracteres"
  }

  return null
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("es-CO")} COP`
}

export function generatePaymentInstructions(deposit: number): string {
  return `
Para confirmar tu reserva, realiza el depósito de ${formatCurrency(deposit)} a:

📱 Nequi: ${PAYMENT_CONFIG.NEQUI_NUMBER}

Luego:
1. Sube una foto del comprobante de pago, O
2. Ingresa la referencia de la transacción

¡Tu reserva será confirmada inmediatamente!
  `.trim()
}

export async function processPaymentReceipt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }

    reader.onerror = () => {
      reject(new Error("Error al procesar el archivo"))
    }

    reader.readAsDataURL(file)
  })
}

export function getPaymentStatus(booking: any): "confirmed" | "pending" | "expired" {
  if (booking.receipt || booking.trxRef) {
    return "confirmed"
  }

  // Check if booking is older than 24 hours without payment proof
  const bookingTime = new Date(booking.createdAt)
  const now = new Date()
  const hoursDiff = (now.getTime() - bookingTime.getTime()) / (1000 * 60 * 60)

  if (hoursDiff > 24) {
    return "expired"
  }

  return "pending"
}

export function getServiceByKey(key: keyof typeof PAYMENT_CONFIG.SERVICES) {
  return PAYMENT_CONFIG.SERVICES[key]
}

export function getAllServices() {
  return Object.entries(PAYMENT_CONFIG.SERVICES).map(([key, service]) => ({
    key,
    ...service,
  }))
}
