"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Smartphone, AlertCircle } from "lucide-react"
import { TIME_CONFIG } from "@/lib/time-slots"

export function PaymentInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Información de pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <Smartphone className="w-5 h-5 text-primary" />
          <div>
            <div className="font-medium text-primary">Nequi</div>
            <div className="text-sm font-mono">{TIME_CONFIG.NEQUI_NUMBER}</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Depósito requerido:</span>
            <Badge variant="secondary">50% del valor</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Duración del turno:</span>
            <Badge variant="outline">{TIME_CONFIG.SLOT_DURATION} minutos</Badge>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-700 dark:text-yellow-300">
            <strong>Importante:</strong> El depósito del 50% es requerido para confirmar tu reserva. Puedes subir el
            comprobante de pago o ingresar la referencia de transacción.
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>Horarios de atención:</strong>
          <br />
          Lunes a Sábado: {TIME_CONFIG.OPENING_HOUR}:00 AM - {TIME_CONFIG.CLOSING_HOUR}:00 PM
        </div>
      </CardContent>
    </Card>
  )
}
