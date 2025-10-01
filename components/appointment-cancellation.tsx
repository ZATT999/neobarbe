"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabaseStorage, type Booking } from "@/lib/supabase-storage"
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

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
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

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
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

export function AppointmentCancellation() {
  const [searchPhone, setSearchPhone] = useState("")
  const [searchName, setSearchName] = useState("")
  const [userBookings, setUserBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { toast } = useToast()

  const searchBookings = async () => {
    if (!searchPhone.trim() && !searchName.trim()) {
      setError("Ingresa tu teléfono o nombre para buscar tus citas")
      return
    }

    setIsSearching(true)
    setError("")
    setSuccess("")

    try {
      const allBookings = await supabaseStorage.getBookings()

      const filteredBookings = allBookings.filter((booking) => {
        const phoneMatch = searchPhone.trim()
          ? booking.phone.replace(/\D/g, "").includes(searchPhone.replace(/\D/g, ""))
          : true
        const nameMatch = searchName.trim() ? booking.name.toLowerCase().includes(searchName.toLowerCase()) : true

        // Only show upcoming bookings that haven't been cancelled
        const isUpcoming = new Date(`${booking.date}T${booking.from}:00`) > new Date()
        const isNotCancelled = !booking.cancelled_at

        return phoneMatch && nameMatch && isUpcoming && isNotCancelled
      })

      setUserBookings(filteredBookings)

      if (filteredBookings.length === 0) {
        setError("No se encontraron citas próximas con esos datos")
      }
    } catch (err) {
      setError("Error al buscar las citas. Intenta nuevamente.")
      console.error("[v0] Error searching bookings:", err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCancelBooking = async (booking: Booking) => {
    setIsLoading(true)
    setError("")

    try {
      // Check if booking can be cancelled
      const { canCancel, reason } = await supabaseStorage.canCancelBooking(booking.id)

      if (!canCancel) {
        setError(reason || "No se puede cancelar esta cita")
        setIsLoading(false)
        return
      }

      // Cancel the booking
      const success = await supabaseStorage.cancelBooking(
        booking.id,
        cancellationReason.trim() || "Cancelada por cliente",
      )

      if (success) {
        setSuccess("Tu cita ha sido cancelada exitosamente. Se ha enviado una notificación al barbero.")
        setUserBookings((prev) => prev.filter((b) => b.id !== booking.id))
        setCancellationReason("")
        setSelectedBooking(null)

        toast({
          title: "Cita cancelada",
          description: "Tu cita ha sido cancelada exitosamente",
        })
      } else {
        throw new Error("Failed to cancel booking")
      }
    } catch (err) {
      setError("Error al cancelar la cita. Intenta nuevamente.")
      console.error("[v0] Error cancelling booking:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getRemainingCancellationTime = (createdAt: string): string => {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursPassed = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    const remainingMinutes = Math.max(0, (1 - hoursPassed) * 60)

    if (remainingMinutes <= 0) {
      return "Tiempo agotado"
    }

    if (remainingMinutes < 60) {
      return `${Math.floor(remainingMinutes)} minutos restantes`
    }

    return "Menos de 1 hora restante"
  }

  const canCancelBooking = (createdAt: string): boolean => {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursPassed = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursPassed <= 1
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <XCircleIcon className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-foreground">Cancelar cita</h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Busca y cancela tus citas programadas de forma rápida y sencilla
        </p>
      </div>

      {success && (
        <Alert className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5 animate-scale-in">
          <CheckCircleIcon className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-700 font-semibold text-base">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="animate-scale-in">
          <XCircleIcon className="h-5 w-5" />
          <AlertDescription className="font-semibold text-base">{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-border/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <SearchIcon className="w-5 h-5 text-primary" />
            </div>
            Buscar mis citas
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Ingresa tu teléfono o nombre para encontrar tus reservas activas
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-phone" className="text-sm font-semibold flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-primary" />
                Número de teléfono
              </Label>
              <Input
                id="search-phone"
                placeholder="Ej: 3001234567"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchBookings()}
                className="h-14 text-base border-2 focus:border-primary transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="search-name" className="text-sm font-semibold">
                Nombre (opcional)
              </Label>
              <Input
                id="search-name"
                placeholder="Tu nombre completo"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchBookings()}
                className="h-14 text-base border-2 focus:border-primary transition-all duration-200"
              />
            </div>
          </div>

          <Button
            onClick={searchBookings}
            disabled={isSearching}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
          >
            {isSearching ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Buscando...
              </>
            ) : (
              <>
                Buscar mis citas
                <SearchIcon className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {userBookings.length > 0 && (
        <Card className="border-2 border-border/50 shadow-lg animate-scale-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
              Tus citas próximas
              <Badge className="ml-auto bg-primary/20 text-primary hover:bg-primary/30 font-bold">
                {userBookings.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userBookings.map((booking, index) => {
                const canCancel = canCancelBooking(booking.created_at)
                const remainingTime = getRemainingCancellationTime(booking.created_at)

                return (
                  <div
                    key={booking.id}
                    className="p-6 border-2 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 hover:border-primary/30 transition-all duration-200 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-bold text-lg mb-1">
                              {new Date(booking.date).toLocaleDateString("es-CO", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <ClockIcon className="w-4 h-4" />
                              <span className="font-semibold">
                                {booking.from} - {booking.to}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-13">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <span className="text-muted-foreground">Servicio:</span>
                            <span className="font-semibold">{booking.service_type || "Corte de cabello"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-muted-foreground">Precio:</span>
                            <span className="font-semibold text-green-600">
                              ${booking.price.toLocaleString("es-CO")} COP
                            </span>
                          </div>
                        </div>

                        {canCancel ? (
                          <Badge variant="secondary" className="text-xs font-semibold">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {remainingTime}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs font-semibold">
                            <XCircleIcon className="w-3 h-3 mr-1" />
                            No se puede cancelar
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 lg:w-48">
                        {canCancel ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="lg"
                                onClick={() => setSelectedBooking(booking)}
                                className="w-full font-bold transition-all duration-200 hover:scale-[1.02]"
                              >
                                <XCircleIcon className="w-5 h-5 mr-2" />
                                Cancelar cita
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-2xl font-bold">Cancelar cita</AlertDialogTitle>
                                <AlertDialogDescription className="text-base leading-relaxed">
                                  ¿Estás seguro de que quieres cancelar tu cita del{" "}
                                  <strong>{new Date(booking.date).toLocaleDateString("es-CO")}</strong> a las{" "}
                                  <strong>{booking.from}</strong>?
                                  <br />
                                  <br />
                                  Esta acción no se puede deshacer y se enviará una notificación al barbero.
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <div className="space-y-2 py-4">
                                <Label htmlFor="cancellation-reason" className="text-sm font-semibold">
                                  Motivo de cancelación (opcional)
                                </Label>
                                <Textarea
                                  id="cancellation-reason"
                                  placeholder="Ej: Cambio de planes, emergencia, etc."
                                  value={cancellationReason}
                                  onChange={(e) => setCancellationReason(e.target.value)}
                                  className="min-h-[100px] text-base border-2 focus:border-primary"
                                />
                              </div>

                              <AlertDialogFooter className="flex-col sm:flex-row gap-3">
                                <AlertDialogCancel
                                  onClick={() => {
                                    setSelectedBooking(null)
                                    setCancellationReason("")
                                  }}
                                  className="w-full sm:w-auto font-semibold"
                                >
                                  No cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelBooking(booking)}
                                  disabled={isLoading}
                                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 font-bold"
                                >
                                  {isLoading ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                      Cancelando...
                                    </>
                                  ) : (
                                    "Sí, cancelar cita"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <div className="text-xs text-center text-muted-foreground bg-muted/50 rounded-xl p-3 border">
                            Solo puedes cancelar dentro de la primera hora después de hacer la reserva
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-3 text-primary">Política de cancelación</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>Solo puedes cancelar dentro de la primera hora después de hacer la reserva</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>Las citas canceladas envían una notificación automática al barbero</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>No se pueden cancelar citas que ya pasaron</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>El depósito será reembolsado según las políticas del establecimiento</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
