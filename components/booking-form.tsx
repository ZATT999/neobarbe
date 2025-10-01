"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TimeSlots } from "@/components/time-slots"
import { PaymentConfirmation } from "@/components/payment-confirmation"
import { ServiceSelector } from "@/components/service-selector"
import { supabaseStorage, type User, type Booking } from "@/lib/supabase-storage"
import { TIME_CONFIG, type TimeSlot } from "@/lib/time-slots"
import { validatePaymentAmount, PAYMENT_CONFIG, getServiceByKey } from "@/lib/payment"
import { useToast } from "@/hooks/use-toast"

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const ScissorsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.89-2 2-2 2 .89 2 2zm0 12c-1.1 0-2-.89-2-2s.89-2 2-2 2 .89 2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5zM19 3l-6 6 2 2 7-7V3z" />
  </svg>
)

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
)

const DollarSignIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    />
  </svg>
)

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
)

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
  </svg>
)

const Trash2Icon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
)

interface BookingFormProps {
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedSlot: TimeSlot | null
  setSelectedSlot: (slot: TimeSlot | null) => void
  price: number
  setPrice: (price: number) => void
  phone: string
  setPhone: (phone: string) => void
  paymentRef: string
  setPaymentRef: (ref: string) => void
  currentUser: User
}

export function BookingForm({
  selectedDate,
  setSelectedDate,
  selectedSlot,
  setSelectedSlot,
  price,
  setPrice,
  phone,
  setPhone,
  paymentRef,
  setPaymentRef,
  currentUser,
}: BookingFormProps) {
  const [step, setStep] = useState<"booking" | "payment" | "thankyou">("booking")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [lastBooking, setLastBooking] = useState<{ date: string; time: string; name: string; service: string } | null>(
    null,
  )
  const [selectedService, setSelectedService] = useState("CORTE_SENCILLO")
  const [serviceDuration, setServiceDuration] = useState(35)
  const { toast } = useToast()

  const validateBookingDetails = (): string | null => {
    if (!selectedSlot) {
      return "Selecciona un horario disponible"
    }

    if (!phone.trim()) {
      return "Ingresa tu número de teléfono"
    }

    if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) {
      return "El teléfono debe tener 10 dígitos"
    }

    const priceValidation = validatePaymentAmount(price)
    if (priceValidation) {
      return priceValidation
    }

    return null
  }

  const handleProceedToPayment = async () => {
    setError("")

    const validation = validateBookingDetails()
    if (validation) {
      setError(validation)
      return
    }

    try {
      // Check if slot is still available
      const existingBookings = await supabaseStorage.getBookingsForDate(selectedDate)
      const conflict = existingBookings.find((b) => b.from === selectedSlot!.start)

      if (conflict) {
        setError("Este horario ya fue reservado por otro cliente")
        setSelectedSlot(null)
        return
      }

      setStep("payment")
    } catch (err) {
      setError("Error al verificar disponibilidad. Intenta nuevamente.")
      console.error("[v0] Error checking availability:", err)
    }
  }

  const handlePaymentConfirmed = async (paymentData: { reference?: string; receipt?: string }) => {
    setIsLoading(true)
    setError("")

    try {
      // Check if user exists, if not create them
      const users = await supabaseStorage.getUsers()
      const existingUser = users.find((u) => u.name.toLowerCase() === currentUser.name.toLowerCase())

      if (!existingUser) {
        // Add user with phone number if not exists
        await supabaseStorage.addUser({
          name: currentUser.name,
          phone: phone.trim(),
          admin: currentUser.admin,
        })
      } else if (!existingUser.phone && phone.trim()) {
        // Update existing user with phone number
        await supabaseStorage.updateUser(existingUser.id, { phone: phone.trim() })
      }

      const selectedServiceData = getServiceByKey(selectedService as keyof typeof PAYMENT_CONFIG.SERVICES)

      const bookingData: Omit<Booking, "id" | "created_at"> = {
        date: selectedDate,
        from: selectedSlot!.start,
        to: selectedSlot!.end,
        name: currentUser.name,
        phone: phone.trim(),
        price,
        deposit: Math.round(price * 0.5),
        nequi: TIME_CONFIG.NEQUI_NUMBER,
        trx_ref: paymentData.reference,
        receipt: paymentData.receipt,
        service_type: selectedServiceData.name,
      }

      const newBooking = await supabaseStorage.addBooking(bookingData)

      if (newBooking) {
        setLastBooking({
          date: selectedDate,
          time: `${selectedSlot!.start} - ${selectedSlot!.end}`,
          name: currentUser.name,
          service: selectedServiceData.name,
        })
        setStep("thankyou")

        toast({
          title: "¡Reserva confirmada!",
          description: `Tu cita está programada para el ${selectedDate} a las ${selectedSlot!.start}. Se ha enviado una notificación al barbero.`,
        })
      } else {
        throw new Error("Failed to create booking")
      }
    } catch (err) {
      setError("Error al procesar la reserva. Intenta nuevamente.")
      console.error("[v0] Booking error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToBooking = () => {
    setStep("booking")
    setError("")
  }

  const handleClear = () => {
    setSelectedSlot(null)
    setPhone("")
    setPaymentRef("")
    setError("")
    setStep("booking")
    setSelectedService("CORTE_SENCILLO")
    setPrice(PAYMENT_CONFIG.SERVICES.CORTE_SENCILLO.price)
    setServiceDuration(35)
  }

  const handleNewBooking = () => {
    setStep("booking")
    setSelectedSlot(null)
    setPhone("")
    setPaymentRef("")
    setError("")
    setLastBooking(null)
    setSelectedService("CORTE_SENCILLO")
    setPrice(PAYMENT_CONFIG.SERVICES.CORTE_SENCILLO.price)
    setServiceDuration(35)
  }

  const handleServiceSelect = (serviceKey: string, servicePrice: number, duration: number) => {
    setSelectedService(serviceKey)
    setPrice(servicePrice)
    setServiceDuration(duration)
    setSelectedSlot(null)
  }

  if (step === "thankyou") {
    return (
      <div className="space-y-6">
        <div className="text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-green-600 mb-4">¡Gracias por tu reserva!</h2>

          <div className="bg-muted/50 rounded-2xl p-6 mb-6 border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Detalles de tu cita confirmada:</h3>

            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium">Fecha:</span>{" "}
                  {lastBooking &&
                    new Date(lastBooking.date).toLocaleDateString("es-CO", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-foreground">⏰</span>
                </div>
                <div>
                  <span className="font-medium">Hora:</span> {lastBooking?.time}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ScissorsIcon className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <span className="font-medium">Servicio:</span> {lastBooking?.service}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-foreground">👤</span>
                </div>
                <div>
                  <span className="font-medium">Cliente:</span> {lastBooking?.name}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-6">
            <p className="text-sm text-foreground leading-relaxed">
              <strong>📍 NEA BARBER</strong> te espera para brindarte el mejor servicio. Recuerda llegar 5 minutos antes
              de tu cita.
            </p>
          </div>

          <Button
            onClick={handleNewBooking}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 h-14 transition-all duration-200 hover:scale-[1.02]"
          >
            Hacer nueva reserva
          </Button>
        </div>
      </div>
    )
  }

  if (step === "payment") {
    const selectedServiceData = getServiceByKey(selectedService as keyof typeof PAYMENT_CONFIG.SERVICES)

    return (
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold">Resumen de reserva</div>
                <div className="text-sm text-muted-foreground font-normal">Confirma los detalles de tu cita</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background/50 rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Fecha y hora</span>
                </div>
                <div className="font-bold text-lg">{new Date(selectedDate).toLocaleDateString("es-CO")}</div>
                <div className="text-primary font-semibold">
                  {selectedSlot?.start} - {selectedSlot?.end}
                </div>
              </div>

              <div className="bg-background/50 rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <ScissorsIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Servicio</span>
                </div>
                <div className="font-bold text-lg">{selectedServiceData.name}</div>
                <div className="text-muted-foreground">{selectedServiceData.duration} minutos</div>
              </div>

              <div className="bg-background/50 rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <PhoneIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Contacto</span>
                </div>
                <div className="font-bold text-lg">{currentUser.name}</div>
                <div className="text-muted-foreground">{phone}</div>
              </div>

              <div className="bg-background/50 rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSignIcon className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Precio</span>
                </div>
                <div className="font-bold text-lg">${price.toLocaleString("es-CO")} COP</div>
                <div className="text-primary font-semibold">
                  Depósito: ${Math.round(price * 0.5).toLocaleString("es-CO")}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleBackToBooking}
                disabled={isLoading}
                className="flex items-center gap-2 bg-transparent hover:bg-primary/10 transition-all duration-200"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>

        <PaymentConfirmation amount={price} onPaymentConfirmed={handlePaymentConfirmed} isLoading={isLoading} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ScissorsIcon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Reservar turno</h2>
        <p className="text-muted-foreground">Agenda tu cita en NEA BARBER</p>
      </div>

      <div className="space-y-6">
        {error && (
          <Alert variant="destructive" className="animate-fade-in-up">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <ServiceSelector selectedService={selectedService} onServiceSelect={handleServiceSelect} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              Selecciona fecha
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="h-14 text-base bg-background border-2 focus:border-primary transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
              <PhoneIcon className="w-4 h-4 text-primary" />
              Número de teléfono
            </Label>
            <Input
              id="phone"
              placeholder="Ej: 3001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-14 text-base bg-background border-2 focus:border-primary transition-all duration-200"
            />
          </div>
        </div>

        <TimeSlots
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          onSlotSelect={setSelectedSlot}
          serviceDuration={serviceDuration}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={handleProceedToPayment}
            disabled={!selectedSlot}
            className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center justify-center gap-2 text-base transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
          >
            Continuar al pago
            <ArrowRightIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            className="h-14 px-6 flex items-center justify-center gap-2 border-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200 bg-transparent"
          >
            <Trash2Icon className="w-4 h-4" />
            Limpiar
          </Button>
        </div>
      </div>
    </div>
  )
}
