"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getCurrentTimeSlots, formatSlotTime, type TimeSlot } from "@/lib/time-slots"
import { supabaseStorage } from "@/lib/supabase-storage"

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

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
)

const ZapIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

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

const TimerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

interface TimeSlotsProps {
  selectedDate: string
  selectedSlot: TimeSlot | null
  onSlotSelect: (slot: TimeSlot | null) => void
}

export function TimeSlots({ selectedDate, selectedSlot, onSlotSelect }: TimeSlotsProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const updateSlots = useCallback(async () => {
    if (!selectedDate) return

    setIsLoading(true)

    try {
      const existingBookings = await supabaseStorage.getBookingsForDate(selectedDate)
      const generatedSlots = getCurrentTimeSlots(selectedDate, existingBookings)

      setSlots(generatedSlots)

      // Clear selection if previously selected slot is no longer available
      if (selectedSlot && !generatedSlots.find((s) => s.start === selectedSlot.start && s.available)) {
        onSlotSelect(null)
      }
    } catch (error) {
      console.error("[v0] Error updating slots:", error)
      setSlots([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate, selectedSlot, onSlotSelect])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    updateSlots()

    // Timer disabled - slots are now persistent and don't get removed
    // const interval = setInterval(updateSlots, 300000) // Update every 5 minutes
    // return () => clearInterval(interval)
  }, [updateSlots])

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.available) return

    // Toggle selection
    if (selectedSlot?.start === slot.start) {
      onSlotSelect(null)
    } else {
      onSlotSelect(slot)
    }
  }

  const availableCount = slots.filter((slot) => slot.available).length
  const totalCount = slots.length
  const isToday = new Date(selectedDate).toDateString() === new Date().toDateString()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <Label className="text-lg font-semibold text-foreground">Cargando horarios disponibles...</Label>
            <p className="text-sm text-muted-foreground">Verificando disponibilidad</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted/10 border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
            {isToday ? (
              <TimerIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse" />
            ) : (
              <ZapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <Label className="text-base sm:text-lg font-semibold text-foreground">
              {isToday ? "Horarios desde ahora" : "Horarios disponibles"}
            </Label>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isToday
                ? `Turnos disponibles desde las ${currentTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`
                : "Selecciona tu turno de 35 minutos"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-green-500/20 border border-green-500/30 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-bold text-xs sm:text-sm">{availableCount} LIBRES</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 bg-red-500/20 border border-red-500/30 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full" />
            <span className="text-red-400 font-bold text-xs sm:text-sm">{totalCount - availableCount} OCUPADOS</span>
          </div>
        </div>
      </div>

      {availableCount > 0 && (
        <div className="bg-gradient-to-r from-green-500/10 to-primary/10 border border-green-500/30 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-green-400 text-base sm:text-lg">
                {availableCount} cupos {isToday ? "desde ahora" : "disponibles"}
              </div>
              <div className="text-xs sm:text-sm text-green-400/80">
                {isToday ? (
                  <>
                    Disponibles desde las{" "}
                    {currentTime.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })} - Hoy
                  </>
                ) : (
                  <>
                    Para el{" "}
                    {new Date(selectedDate).toLocaleDateString("es-CO", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </>
                )}
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-green-500/20 text-green-400 border-green-500/30 font-bold text-sm sm:text-lg px-2 sm:px-4 py-1 sm:py-2 flex-shrink-0"
            >
              {isToday ? "AHORA" : `${availableCount} LIBRES`}
            </Badge>
          </div>
        </div>
      )}

      {slots.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-muted/5 border border-border rounded-2xl">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClockIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground text-base sm:text-lg">
            {isToday ? "No hay más horarios hoy" : "No hay horarios disponibles"}
          </p>
          <p className="text-muted-foreground/70 text-xs sm:text-sm">
            {isToday ? "Prueba mañana o más tarde" : "Intenta con otra fecha"}
          </p>
        </div>
      ) : (
        /* Improved mobile-first grid layout for time slots */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {slots.map((slot, index) => (
            <Button
              key={index}
              variant={selectedSlot?.start === slot.start ? "default" : "outline"}
              className={`h-16 sm:h-20 p-2 sm:p-4 relative transition-all duration-300 group ${
                !slot.available
                  ? "opacity-40 cursor-not-allowed bg-muted/5 border-muted/20 hover:bg-muted/5"
                  : selectedSlot?.start === slot.start
                    ? "bg-primary text-black border-primary shadow-lg shadow-primary/25 scale-105"
                    : "hover:bg-primary/10 hover:border-primary/30 hover:scale-102"
              }`}
              disabled={!slot.available}
              onClick={() => handleSlotClick(slot)}
            >
              <div className="text-center w-full">
                <div className="font-bold text-sm sm:text-base mb-0.5 sm:mb-1">{slot.start}</div>
                <div className="text-xs opacity-75 font-medium">{slot.end}</div>
                {!slot.available && slot.bookedBy && (
                  <div className="flex items-center justify-center gap-1 mt-1 sm:mt-2">
                    <UserIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="text-xs truncate max-w-12 sm:max-w-16 font-medium" title={slot.bookedBy}>
                      {slot.bookedBy}
                    </span>
                  </div>
                )}
              </div>

              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
                {slot.available ? (
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full shadow-sm" />
                ) : (
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full shadow-sm" />
                )}
              </div>

              {/* Selection glow effect */}
              {selectedSlot?.start === slot.start && (
                <div className="absolute inset-0 bg-primary/20 rounded-lg -z-10 blur-sm" />
              )}
            </Button>
          ))}
        </div>
      )}

      {selectedSlot && (
        <div className="bg-gradient-to-r from-primary/10 to-green-600/10 border border-primary/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">Turno seleccionado</div>
              <div className="text-sm text-muted-foreground">
                {formatSlotTime(selectedSlot)} • 35 minutos de servicio
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-semibold">
              {formatSlotTime(selectedSlot)}
            </Badge>
          </div>
        </div>
      )}

      {availableCount === 0 && totalCount > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <XCircleIcon className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                {isToday ? "No hay más turnos hoy" : "Día completo"}
              </div>
              <div className="text-sm text-yellow-600/80 dark:text-yellow-400/80">
                {isToday
                  ? "Todos los horarios restantes están ocupados. Prueba mañana."
                  : "Todos los horarios están ocupados. Prueba con otra fecha."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
