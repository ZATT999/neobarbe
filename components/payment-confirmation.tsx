"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CreditCard, CheckCircle, AlertCircle, Smartphone, Copy, Eye, Trash2 } from "lucide-react"
import {
  PAYMENT_CONFIG,
  calculateDeposit,
  validatePaymentProof,
  formatCurrency,
  processPaymentReceipt,
} from "@/lib/payment"
import { useToast } from "@/hooks/use-toast"

interface PaymentConfirmationProps {
  amount: number
  onPaymentConfirmed: (paymentData: { reference?: string; receipt?: string }) => void
  isLoading?: boolean
}

export function PaymentConfirmation({ amount, onPaymentConfirmed, isLoading = false }: PaymentConfirmationProps) {
  const [paymentReference, setPaymentReference] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const deposit = calculateDeposit(amount)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")

    const validation = validatePaymentProof(file)
    if (validation) {
      setError(validation)
      return
    }

    try {
      setIsProcessing(true)
      const preview = await processPaymentReceipt(file)
      setReceiptFile(file)
      setReceiptPreview(preview)

      toast({
        title: "Comprobante cargado",
        description: "El comprobante se ha cargado correctamente",
      })
    } catch (err) {
      setError("Error al procesar el archivo")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)

    // Reset file input
    const fileInput = document.getElementById("receipt-upload") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const handleCopyNequiNumber = () => {
    navigator.clipboard.writeText(PAYMENT_CONFIG.NEQUI_NUMBER)
    toast({
      title: "Copiado",
      description: "Número de Nequi copiado al portapapeles",
    })
  }

  const handleConfirmPayment = () => {
    setError("")

    const validation = validatePaymentProof(receiptFile, paymentReference)
    if (validation) {
      setError(validation)
      return
    }

    onPaymentConfirmed({
      reference: paymentReference.trim() || undefined,
      receipt: receiptPreview || undefined,
    })
  }

  const handleViewReceipt = () => {
    if (receiptPreview) {
      const newWindow = window.open()
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Comprobante de pago</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
              <img src="${receiptPreview}" style="max-width:100%;max-height:100%;object-fit:contain;" />
            </body>
          </html>
        `)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Confirmación de pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Payment Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Valor del servicio:</span>
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Depósito requerido (50%):</span>
            <span className="font-semibold text-primary text-lg">{formatCurrency(deposit)}</span>
          </div>
          <Separator />
        </div>

        {/* Nequi Payment Info */}
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Smartphone className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium text-primary">Pagar con Nequi</div>
              <div className="text-sm text-muted-foreground">Transfiere el depósito al siguiente número</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-background rounded border">
            <span className="font-mono text-lg flex-1">{PAYMENT_CONFIG.NEQUI_NUMBER}</span>
            <Button variant="ghost" size="sm" onClick={handleCopyNequiNumber}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Payment Proof Upload */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="receipt-upload">Comprobante de pago</Label>
            <Input
              id="receipt-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isProcessing || isLoading}
              className="mt-1"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Sube una foto del comprobante (JPG, PNG, WebP - máx. 5MB)
            </div>
          </div>

          {receiptPreview && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Comprobante cargado</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={handleViewReceipt}>
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRemoveReceipt}>
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
              {receiptFile && (
                <div className="text-xs text-muted-foreground mt-1">
                  {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Alternative: Payment Reference */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">O ingresa la referencia</span>
          </div>
        </div>

        <div>
          <Label htmlFor="payment-ref">Referencia de transacción</Label>
          <Input
            id="payment-ref"
            placeholder="Código de la transacción Nequi"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            disabled={isLoading}
            className="mt-1"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Ingresa el código que aparece en tu transacción de Nequi
          </div>
        </div>

        {/* Confirmation Button */}
        <Button
          onClick={handleConfirmPayment}
          disabled={isLoading || isProcessing || (!receiptFile && !paymentReference.trim())}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            "Procesando reserva..."
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar pago y reservar
            </>
          )}
        </Button>

        {/* Payment Status */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {receiptFile || paymentReference.trim() ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Listo para confirmar</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span>Sube comprobante o ingresa referencia</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
