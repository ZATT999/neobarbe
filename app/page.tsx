"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserRegistration } from "@/components/user-registration"
import { BookingForm } from "@/components/booking-form"
import { AdminPanel } from "@/components/admin-panel"
import { PaymentInfo } from "@/components/payment-info"
import { DatabaseSetup } from "@/components/database-setup"
import { AppointmentCancellation } from "@/components/appointment-cancellation"
import { supabaseStorage, type User } from "@/lib/supabase-storage"
import type { TimeSlot } from "@/lib/time-slots"
import { PAYMENT_CONFIG } from "@/lib/payment"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const ScissorsIcon = () => (
  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-primary" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.89-2 2-2 2 .89 2 2-.89 2-2 2zm0 12c-1.1 0-2-.89-2-2s.89-2 2-2 2 .89 2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5zM19 3l-6 6 2 2 7-7V3z" />
  </svg>
)

const CrownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2.7-2h8.6l.9-5.4-2.1 1.7L12 8l-3.1 2.3-2.1-1.7L6.7 14z" />
  </svg>
)

const LogOutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l4-4m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
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

export default function BarbershopBooking() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [price, setPrice] = useState(PAYMENT_CONFIG.DEFAULT_HAIRCUT_PRICE)
  const [phone, setPhone] = useState("")
  const [paymentRef, setPaymentRef] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null)
  const [currentView, setCurrentView] = useState<"booking" | "cancellation">("booking")
  const { toast } = useToast()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]
        setSelectedDate(today)

        const tablesExist = await supabaseStorage.checkDatabaseTables()
        setDatabaseReady(tablesExist)

        if (tablesExist) {
          const existingUser = await supabaseStorage.getCurrentUser()
          if (existingUser) {
            if (existingUser.is_banned) {
              toast({
                title: "Acceso denegado",
                description: existingUser.banned_reason || "Tu cuenta ha sido suspendida. Contacta al administrador.",
                variant: "destructive",
                duration: 5000,
              })
              await supabaseStorage.setCurrentUser(null)
              setCurrentUser(null)
              return
            }

            setCurrentUser(existingUser)
            if (existingUser.admin && supabaseStorage.isAdminDevice()) {
              setIsAdmin(true)
            }
          }
        } else {
          console.log("[v0] Database tables not found - showing setup interface")
        }
      } catch (error) {
        console.error("[v0] Error initializing app:", error)
        setDatabaseReady(false)
        toast({
          title: "Error de conexión",
          description: "Hubo un problema al conectar con la base de datos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [toast])

  const handleDatabaseSetupComplete = async () => {
    setDatabaseReady(true)

    try {
      const existingUser = await supabaseStorage.getCurrentUser()
      if (existingUser) {
        setCurrentUser(existingUser)
        if (existingUser.admin && supabaseStorage.isAdminDevice()) {
          setIsAdmin(true)
        }
      }
    } catch (error) {
      console.error("[v0] Error re-initializing after setup:", error)
    }
  }

  const handleLogout = async () => {
    await supabaseStorage.setCurrentUser(null)
    setCurrentUser(null)
    setIsAdmin(false)
    setSelectedSlot(null)
    setPhone("")
    setPaymentRef("")
    setCurrentView("booking")

    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    })
  }

  const handleUserRegistered = async (user: User) => {
    await supabaseStorage.setCurrentUser(user)
    setCurrentUser(user)
  }

  const handleAdminLogin = async (isAdminUser: boolean) => {
    setIsAdmin(isAdminUser)
    if (isAdminUser && currentUser) {
      await supabaseStorage.setCurrentUser(currentUser)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-8 animate-fade-in-up">
          <div className="relative">
            <div className="w-24 h-24 masculine-card rounded-2xl flex items-center justify-center mx-auto animate-glow">
              <ScissorsIcon />
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-4xl font-black text-foreground tracking-tight">
              <span className="text-primary">NEA</span> BARBER
            </div>
            <div className="text-muted-foreground text-lg font-medium">Cargando sistema...</div>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (databaseReady === false) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <header className="text-center mb-12 animate-fade-in-up">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 masculine-card rounded-2xl p-4 animate-glow">
                    <img
                      src="/images/nea-barber-logo.png"
                      alt="NEA BARBER SHOP Logo"
                      className="w-full h-full object-contain filter brightness-110"
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <CrownIcon className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 tracking-tight">
                <span className="text-primary">NEA</span> <span className="text-foreground">BARBER</span>
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium">
                Configuración inicial requerida para comenzar
              </p>
            </header>

            <div className="max-w-2xl mx-auto">
              <div className="masculine-card rounded-2xl p-8 animate-scale-in">
                <DatabaseSetup onSetupComplete={handleDatabaseSetupComplete} />
              </div>
            </div>
          </div>
        </div>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 sm:mb-12 gap-6 animate-fade-in-up">
            <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
              <div className="relative group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 masculine-card rounded-2xl p-3 sm:p-4 transition-all duration-300 group-hover:scale-105 animate-glow">
                  <img
                    src="/images/nea-barber-logo.png"
                    alt="NEA BARBER SHOP Logo"
                    className="w-full h-full object-contain filter brightness-110"
                  />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <CrownIcon className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                </div>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight">
                  <span className="text-primary">NEA</span> <span className="text-foreground">BARBER</span>
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg lg:text-xl mt-2 sm:mt-3 font-medium">
                  Reserva tu turno de <span className="text-primary font-bold">35 minutos</span>
                </p>

                <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 sm:mt-6">
                  <div className="flex items-center gap-2 sm:gap-3 masculine-card px-3 py-2 sm:px-4 sm:py-3 rounded-xl">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                      Desde:{" "}
                      <span className="text-primary">
                        ${PAYMENT_CONFIG.DEFAULT_HAIRCUT_PRICE.toLocaleString("es-CO")} COP
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 masculine-card px-3 py-2 sm:px-4 sm:py-3 rounded-xl">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                      Nequi: <span className="font-mono text-green-400">3015378286</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {currentUser && (
              <div className="flex items-center gap-3 sm:gap-4 masculine-card rounded-2xl p-3 sm:p-4 w-full lg:w-auto">
                <div className="text-right flex-1 lg:flex-initial">
                  <div className="font-bold text-lg sm:text-xl truncate">{currentUser.name}</div>
                  {currentUser.admin && (
                    <Badge className="masculine-button text-xs mt-1">
                      <CrownIcon className="w-3 h-3 mr-1" />
                      ADMIN
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50 transition-all duration-200 bg-transparent border-border/50 font-bold uppercase tracking-wide flex-shrink-0"
                >
                  <LogOutIcon className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">SALIR</span>
                </Button>
              </div>
            )}
          </header>

          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="masculine-card rounded-2xl p-2 flex gap-2 w-full sm:w-auto shadow-lg border-2 border-border/50">
              <Button
                variant={currentView === "booking" ? "default" : "ghost"}
                onClick={() => setCurrentView("booking")}
                className={`flex-1 sm:flex-initial px-6 py-3 font-bold transition-all duration-200 text-sm sm:text-base rounded-xl ${
                  currentView === "booking"
                    ? "masculine-button shadow-md"
                    : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                <ScissorsIcon />
                <span className="ml-2">Reservar</span>
              </Button>
              <Button
                variant={currentView === "cancellation" ? "default" : "ghost"}
                onClick={() => setCurrentView("cancellation")}
                className={`flex-1 sm:flex-initial px-6 py-3 font-bold transition-all duration-200 text-sm sm:text-base rounded-xl ${
                  currentView === "cancellation"
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-md"
                    : "hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                }`}
              >
                <XCircleIcon className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            <div className="xl:col-span-2 space-y-6 lg:space-y-8">
              {currentView === "cancellation" ? (
                <div className="masculine-card rounded-2xl p-6 sm:p-8 animate-scale-in">
                  <AppointmentCancellation />
                </div>
              ) : !currentUser ? (
                <div className="masculine-card rounded-2xl p-6 sm:p-8 animate-scale-in">
                  <UserRegistration onUserRegistered={handleUserRegistered} onAdminLogin={handleAdminLogin} />
                </div>
              ) : (
                <div className="masculine-card rounded-2xl p-6 sm:p-8 animate-scale-in">
                  <BookingForm
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    selectedSlot={selectedSlot}
                    setSelectedSlot={setSelectedSlot}
                    price={price}
                    setPrice={setPrice}
                    phone={phone}
                    setPhone={setPhone}
                    paymentRef={paymentRef}
                    setPaymentRef={setPaymentRef}
                    currentUser={currentUser}
                  />
                </div>
              )}
            </div>

            <div className="space-y-6">
              {isAdmin && (
                <div className="masculine-card rounded-2xl p-6 animate-scale-in">
                  <AdminPanel />
                </div>
              )}
              <div className="masculine-card rounded-2xl p-6 animate-scale-in">
                <PaymentInfo />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
