"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Settings,
  Trash2,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Phone,
  Clock,
  Eye,
  Download,
  Crown,
  XCircle,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Ban,
  ShieldOff,
} from "lucide-react"
import { supabaseStorage, type Booking, type User } from "@/lib/supabase-storage"
import { useToast } from "@/hooks/use-toast"

const BAN_REASONS = [
  { value: "no_show", label: "No se presentó a la cita" },
  { value: "multiple_cancellations", label: "Múltiples cancelaciones" },
  { value: "payment_issues", label: "Problemas de pago" },
  { value: "inappropriate_behavior", label: "Comportamiento inapropiado" },
  { value: "spam", label: "Spam o reservas falsas" },
  { value: "other", label: "Otro motivo" },
]

export function AdminPanel() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBusinessHours, setIsBusinessHours] = useState(false)
  const [nextReset, setNextReset] = useState<Date>(new Date())
  const [banReasonType, setBanReasonType] = useState<string>("")
  const [banReason, setBanReason] = useState("")
  const [cancellationReason, setCancellationReason] = useState("")
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    try {
      const [allBookings, allUsers] = await Promise.all([supabaseStorage.getBookings(), supabaseStorage.getUsers()])

      const sortedBookings = allBookings.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )

      setBookings(sortedBookings)
      setUsers(allUsers)

      console.log("[v0] Loaded data:", { bookings: allBookings.length, users: allUsers.length })
    } catch (error) {
      console.error("[v0] Error loading admin data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    }
  }, [toast])

  const updateBusinessStatus = useCallback(() => {
    setIsBusinessHours(supabaseStorage.isBusinessHours())
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    setNextReset(tomorrow)
  }, [])

  useEffect(() => {
    loadData()
    updateBusinessStatus()
  }, [loadData, updateBusinessStatus])

  useEffect(() => {
    const interval = setInterval(updateBusinessStatus, 60000)
    return () => clearInterval(interval)
  }, [updateBusinessStatus])

  const handleAdminCancelBooking = async (bookingId: string, reason: string) => {
    setIsLoading(true)

    try {
      const success = await supabaseStorage.cancelBooking(bookingId, reason || "Cancelada por administrador")
      if (success) {
        await loadData()
        toast({
          title: "Reserva cancelada",
          description: "La reserva ha sido cancelada y se envió notificación al cliente",
        })
        setCancellationReason("")
      } else {
        throw new Error("Failed to cancel booking")
      }
    } catch (error) {
      console.error("[v0] Error cancelling booking:", error)
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    setIsLoading(true)

    try {
      const success = await supabaseStorage.deleteBooking(bookingId)
      if (success) {
        await loadData()
        toast({
          title: "Reserva eliminada",
          description: "La reserva ha sido eliminada exitosamente y se envió notificación SMS",
        })
      } else {
        throw new Error("Failed to delete booking")
      }
    } catch (error) {
      console.error("[v0] Error deleting booking:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la reserva",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    setIsLoading(true)

    try {
      // Optimistically update UI first
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId))

      const success = await supabaseStorage.deleteUser(userId)

      if (success) {
        toast({
          title: "Usuario eliminado",
          description: `${userName} ha sido eliminado completamente del sistema y todas sus citas futuras fueron canceladas`,
        })

        // Force a fresh data load to ensure consistency
        await loadData()
      } else {
        // Revert optimistic update on failure
        await loadData()
        throw new Error("Failed to delete user")
      }
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      })
      // Reload data to restore correct state
      await loadData()
    } finally {
      setIsLoading(false)
    }
  }

  const handleBanUser = async (userId: string, userName: string, reason: string) => {
    setIsLoading(true)

    try {
      const fullReason =
        banReasonType && banReasonType !== "other"
          ? BAN_REASONS.find((r) => r.value === banReasonType)?.label || reason
          : reason || "Baneado por administrador"

      // Optimistically update UI
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId
            ? {
                ...u,
                is_banned: true,
                banned_at: new Date().toISOString(),
                banned_reason: fullReason,
              }
            : u,
        ),
      )

      const success = await supabaseStorage.banUser(userId, fullReason)

      if (success) {
        toast({
          title: "Usuario baneado",
          description: `${userName} no podrá acceder al sistema. Todas sus citas futuras fueron canceladas.`,
        })
        setBanReason("")
        setBanReasonType("")

        // Refresh data to ensure consistency
        await loadData()
      } else {
        // Revert on failure
        await loadData()
        throw new Error("Failed to ban user")
      }
    } catch (error) {
      console.error("[v0] Error banning user:", error)
      toast({
        title: "Error",
        description: "No se pudo banear el usuario",
        variant: "destructive",
      })
      await loadData()
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnbanUser = async (userId: string, userName: string) => {
    setIsLoading(true)

    try {
      // Optimistically update UI
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId
            ? {
                ...u,
                is_banned: false,
                banned_at: undefined,
                banned_reason: undefined,
                banned_by: undefined,
              }
            : u,
        ),
      )

      const success = await supabaseStorage.unbanUser(userId)

      if (success) {
        toast({
          title: "Usuario desbaneado",
          description: `${userName} puede volver a acceder al sistema`,
        })

        await loadData()
      } else {
        await loadData()
        throw new Error("Failed to unban user")
      }
    } catch (error) {
      console.error("[v0] Error unbanning user:", error)
      toast({
        title: "Error",
        description: "No se pudo desbanear el usuario",
        variant: "destructive",
      })
      await loadData()
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewReceipt = (booking: Booking) => {
    if (booking.receipt) {
      const newWindow = window.open()
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Comprobante - ${booking.name}</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
              <img src="${booking.receipt}" style="max-width:100%;max-height:100%;object-fit:contain;" />
            </body>
          </html>
        `)
      }
    }
  }

  const exportBookings = () => {
    const csvContent = [
      [
        "Fecha",
        "Hora",
        "Cliente",
        "Teléfono",
        "Servicio",
        "Precio",
        "Depósito",
        "Estado",
        "Cancelado",
        "Motivo",
        "Referencia",
        "Creado",
      ].join(","),
      ...bookings.map((b) =>
        [
          b.date,
          `${b.from}-${b.to}`,
          b.name,
          b.phone,
          b.service_type || "Corte de cabello",
          b.price,
          b.deposit,
          b.cancelled_at ? "Cancelada" : "Activa",
          b.cancelled_at ? new Date(b.cancelled_at).toLocaleDateString() : "",
          b.cancellation_reason || "",
          b.trx_ref || "",
          new Date(b.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reservas-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const activeBookings = useMemo(() => bookings.filter((b) => !b.cancelled_at), [bookings])
  const cancelledBookings = useMemo(() => bookings.filter((b) => b.cancelled_at), [bookings])
  const totalRevenue = useMemo(() => activeBookings.reduce((sum, b) => sum + b.deposit, 0), [activeBookings])
  const todayBookings = useMemo(
    () => activeBookings.filter((b) => b.date === new Date().toISOString().split("T")[0]),
    [activeBookings],
  )
  const upcomingBookings = useMemo(() => activeBookings.filter((b) => new Date(b.date) >= new Date()), [activeBookings])

  const todayCancellations = useMemo(
    () =>
      cancelledBookings.filter(
        (b) => b.cancelled_at && new Date(b.cancelled_at).toDateString() === new Date().toDateString(),
      ).length,
    [cancelledBookings],
  )

  const recentCancellations = useMemo(
    () =>
      cancelledBookings
        .filter((b) => b.cancelled_at && new Date(b.cancelled_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(b.cancelled_at!).getTime() - new Date(a.cancelled_at!).getTime()),
    [cancelledBookings],
  )

  const bannedUsers = useMemo(() => users.filter((u) => u.is_banned), [users])
  const activeUsers = useMemo(() => users.filter((u) => !u.is_banned), [users])

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <div>
                <div className="text-sm font-medium">
                  {isBusinessHours ? "Horario comercial activo" : "Fuera de horario"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isBusinessHours ? "9:00 AM - 10:00 PM" : `Próximo reset: ${nextReset.toLocaleString("es-CO")}`}
                </div>
              </div>
            </div>
            <Badge variant={isBusinessHours ? "default" : "secondary"}>{isBusinessHours ? "Abierto" : "Cerrado"}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-muted-foreground">Depósitos</div>
                <div className="font-semibold text-sm sm:text-base">${totalRevenue.toLocaleString("es-CO")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-muted-foreground">Usuarios</div>
                <div className="font-semibold text-sm sm:text-base">{users.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-muted-foreground">Hoy</div>
                <div className="font-semibold text-sm sm:text-base">{todayBookings.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-muted-foreground">Próximas</div>
                <div className="font-semibold text-sm sm:text-base">{upcomingBookings.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm text-muted-foreground">Canceladas hoy</div>
                <div className="font-semibold text-sm sm:text-base">{todayCancellations}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              Panel de administración
            </CardTitle>
            <Button variant="outline" size="sm" onClick={exportBookings} className="text-xs sm:text-sm bg-transparent">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">
              Tienes acceso completo para gestionar reservas, usuarios y ver estadísticas del negocio.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            Gestión de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                Activas ({activeBookings.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex items-center gap-2 text-xs sm:text-sm">
                <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                Canceladas ({cancelledBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              {activeBookings.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">No hay reservas activas</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm whitespace-nowrap">Fecha</TableHead>
                          <TableHead className="text-xs sm:text-sm whitespace-nowrap">Hora</TableHead>
                          <TableHead className="text-xs sm:text-sm whitespace-nowrap">Cliente</TableHead>
                          <TableHead className="hidden sm:table-cell text-xs sm:text-sm whitespace-nowrap">
                            Teléfono
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm whitespace-nowrap">Servicio</TableHead>
                          <TableHead className="text-xs sm:text-sm whitespace-nowrap">Precio</TableHead>
                          <TableHead className="text-xs sm:text-sm whitespace-nowrap">Depósito</TableHead>
                          <TableHead className="hidden md:table-cell text-xs sm:text-sm whitespace-nowrap">
                            Estado
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm whitespace-nowrap">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeBookings.map((booking) => {
                          const isUpcoming = new Date(booking.date) >= new Date()
                          const isToday = booking.date === new Date().toISOString().split("T")[0]

                          return (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                                <div className="flex flex-col">
                                  {new Date(booking.date).toLocaleDateString("es-CO")}
                                  {isToday && (
                                    <Badge variant="secondary" className="text-xs w-fit mt-1">
                                      Hoy
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span className="text-xs">
                                    {booking.from}-{booking.to}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap">
                                {booking.name}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-xs sm:text-sm whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {booking.phone}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                {booking.service_type || "Corte de cabello"}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                ${booking.price.toLocaleString("es-CO")}
                              </TableCell>
                              <TableCell className="font-semibold text-green-600 text-xs sm:text-sm whitespace-nowrap">
                                ${booking.deposit.toLocaleString("es-CO")}
                              </TableCell>
                              <TableCell className="hidden md:table-cell whitespace-nowrap">
                                <Badge variant={isUpcoming ? "default" : "secondary"} className="text-xs">
                                  {isUpcoming ? "Próxima" : "Pasada"}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {booking.receipt && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewReceipt(booking)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                  )}

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm" disabled={isLoading} className="h-8 w-8 p-0">
                                        <XCircle className="w-3 h-3 text-orange-500" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-sm sm:max-w-lg">
                                      <DialogHeader>
                                        <DialogTitle className="text-base sm:text-lg">Cancelar reserva</DialogTitle>
                                        <DialogDescription className="text-sm">
                                          Cancelar la reserva de <strong>{booking.name}</strong> para el{" "}
                                          {new Date(booking.date).toLocaleDateString("es-CO")} a las {booking.from}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="cancellation-reason">Motivo de cancelación</Label>
                                          <Textarea
                                            id="cancellation-reason"
                                            placeholder="Ingresa el motivo de la cancelación..."
                                            value={cancellationReason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            className="min-h-20"
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter className="flex-col sm:flex-row gap-2">
                                        <Button
                                          variant="outline"
                                          onClick={() => setCancellationReason("")}
                                          className="text-sm"
                                        >
                                          Cerrar
                                        </Button>
                                        <Button
                                          onClick={() => handleAdminCancelBooking(booking.id, cancellationReason)}
                                          className="bg-orange-600 hover:bg-orange-700 text-sm"
                                          disabled={isLoading}
                                        >
                                          Cancelar reserva
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" disabled={isLoading} className="h-8 w-8 p-0">
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="max-w-sm sm:max-max-lg">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-base sm:text-lg">
                                          Eliminar reserva
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm">
                                          ¿Estás seguro de que quieres eliminar la reserva de{" "}
                                          <strong>{booking.name}</strong> para el{" "}
                                          {new Date(booking.date).toLocaleDateString("es-CO")} a las {booking.from}?
                                          <br />
                                          <br />
                                          Esta acción no se puede deshacer y se enviará una notificación SMS al cliente.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel className="text-sm">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteBooking(booking.id)}
                                          className="bg-red-600 hover:bg-red-700 text-sm"
                                        >
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-4">
              {cancelledBookings.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <XCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">No hay reservas canceladas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentCancellations.length > 0 && (
                    <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 dark:text-orange-400">
                        <strong>{recentCancellations.length}</strong> cancelaciones en los últimos 7 días
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Fecha Original</TableHead>
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Cliente</TableHead>
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Servicio</TableHead>
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Cancelado</TableHead>
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Motivo</TableHead>
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Depósito</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cancelledBookings.map((booking) => (
                            <TableRow key={booking.id} className="opacity-75">
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span>{new Date(booking.date).toLocaleDateString("es-CO")}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {booking.from}-{booking.to}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm font-medium whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span>{booking.name}</span>
                                  <span className="text-xs text-muted-foreground">{booking.phone}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                {booking.service_type || "Corte de cabello"}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                {booking.cancelled_at && (
                                  <div className="flex flex-col">
                                    <span>{new Date(booking.cancelled_at).toLocaleDateString("es-CO")}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(booking.cancelled_at).toLocaleTimeString("es-CO", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm max-w-32">
                                <div
                                  className="truncate"
                                  title={booking.cancellation_reason || "Sin motivo especificado"}
                                >
                                  {booking.cancellation_reason || "Sin motivo"}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm text-red-600 font-medium whitespace-nowrap">
                                ${booking.deposit.toLocaleString("es-CO")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            Gestión de Usuarios ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2 text-xs sm:text-sm">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Activos ({activeUsers.length})
              </TabsTrigger>
              <TabsTrigger value="banned" className="flex items-center gap-2 text-xs sm:text-sm">
                <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                Baneados ({bannedUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              {activeUsers.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">No hay usuarios activos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeUsers.map((user) => {
                    const userBookings = bookings.filter((b) => b.name.toLowerCase() === user.name.toLowerCase())
                    const activeUserBookings = userBookings.filter((b) => !b.cancelled_at)
                    const cancelledUserBookings = userBookings.filter((b) => b.cancelled_at)
                    const totalSpent = activeUserBookings.reduce((sum, b) => sum + b.deposit, 0)
                    const upcomingBookings = activeUserBookings.filter((b) => new Date(b.date) >= new Date())

                    return (
                      <div key={user.id} className="p-3 sm:p-4 bg-muted/20 rounded-lg border border-border/50">
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-base sm:text-lg truncate">{user.name}</div>
                              <div className="text-xs sm:text-sm text-muted-foreground">
                                Registrado: {new Date(user.created_at).toLocaleDateString("es-CO")}
                              </div>
                              {user.phone && (
                                <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {user.admin && (
                              <Badge variant="default" className="bg-primary text-black text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {!user.admin && (
                              <div className="flex gap-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={isLoading}
                                      className="h-8 w-8 p-0"
                                      onClick={() => {
                                        setSelectedUser(user)
                                        setBanReasonType("")
                                        setBanReason("")
                                      }}
                                    >
                                      <Ban className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-sm sm:max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle className="text-base sm:text-lg">Banear usuario</DialogTitle>
                                      <DialogDescription className="text-sm">
                                        Banear a <strong>{user.name}</strong> del sistema. El usuario no podrá hacer
                                        nuevas reservas y todas sus citas futuras serán canceladas.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="ban-reason-type">Motivo del baneo</Label>
                                        <Select value={banReasonType} onValueChange={setBanReasonType}>
                                          <SelectTrigger id="ban-reason-type">
                                            <SelectValue placeholder="Selecciona un motivo" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {BAN_REASONS.map((reason) => (
                                              <SelectItem key={reason.value} value={reason.value}>
                                                {reason.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      {banReasonType === "other" && (
                                        <div className="space-y-2">
                                          <Label htmlFor="ban-reason-custom">Especifica el motivo</Label>
                                          <Textarea
                                            id="ban-reason-custom"
                                            placeholder="Ingresa el motivo del baneo..."
                                            value={banReason}
                                            onChange={(e) => setBanReason(e.target.value)}
                                            className="min-h-20"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <DialogFooter className="flex-col sm:flex-row gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setBanReason("")
                                          setBanReasonType("")
                                        }}
                                        className="text-sm"
                                      >
                                        Cerrar
                                      </Button>
                                      <Button
                                        onClick={() => handleBanUser(user.id, user.name, banReason)}
                                        className="bg-orange-600 hover:bg-orange-700 text-sm"
                                        disabled={
                                          isLoading ||
                                          !banReasonType ||
                                          (banReasonType === "other" && !banReason.trim())
                                        }
                                      >
                                        Banear usuario
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" disabled={isLoading} className="h-8 w-8 p-0">
                                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="max-w-sm sm:max-w-lg">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-base sm:text-lg">
                                        Eliminar usuario
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-sm">
                                        ¿Estás seguro de que quieres eliminar a <strong>{user.name}</strong>?
                                        <br />
                                        <br />
                                        Esta acción eliminará el usuario permanentemente y cancelará todas sus reservas
                                        futuras. Esta acción no se puede deshacer.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                      <AlertDialogCancel className="text-sm">Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                        className="bg-red-600 hover:bg-red-700 text-sm"
                                      >
                                        Eliminar usuario
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mt-3">
                          <div className="bg-background/50 rounded-lg p-2 sm:p-3 border border-border/30">
                            <div className="text-xs text-muted-foreground">Total Reservas</div>
                            <div className="font-semibold text-base sm:text-lg">{userBookings.length}</div>
                          </div>
                          <div className="bg-background/50 rounded-lg p-2 sm:p-3 border border-border/30">
                            <div className="text-xs text-muted-foreground">Activas</div>
                            <div className="font-semibold text-base sm:text-lg text-green-600">
                              {activeUserBookings.length}
                            </div>
                          </div>
                          <div className="bg-background/50 rounded-lg p-2 sm:p-3 border border-border/30">
                            <div className="text-xs text-muted-foreground">Canceladas</div>
                            <div className="font-semibold text-base sm:text-lg text-red-600">
                              {cancelledUserBookings.length}
                            </div>
                          </div>
                          <div className="bg-background/50 rounded-lg p-2 sm:p-3 border border-border/30">
                            <div className="text-xs text-muted-foreground">Próximas</div>
                            <div className="font-semibold text-base sm:text-lg text-primary">
                              {upcomingBookings.length}
                            </div>
                          </div>
                          <div className="bg-background/50 rounded-lg p-2 sm:p-3 border border-border/30">
                            <div className="text-xs text-muted-foreground">Total Pagado</div>
                            <div className="font-semibold text-base sm:text-lg text-green-600">
                              ${totalSpent.toLocaleString("es-CO")}
                            </div>
                          </div>
                        </div>

                        {userBookings.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <div className="text-xs sm:text-sm font-medium mb-2">Reservas recientes:</div>
                            <div className="space-y-1">
                              {userBookings.slice(0, 3).map((booking) => (
                                <div
                                  key={booking.id}
                                  className={`flex items-center justify-between text-xs rounded p-2 ${
                                    booking.cancelled_at
                                      ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
                                      : "bg-background/30"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="truncate">
                                      {new Date(booking.date).toLocaleDateString("es-CO")} • {booking.from}-{booking.to}
                                    </span>
                                    {booking.cancelled_at && (
                                      <Badge variant="destructive" className="text-xs flex-shrink-0">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Cancelada
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs flex-shrink-0 ${booking.cancelled_at ? "text-red-600" : ""}`}
                                  >
                                    ${booking.deposit.toLocaleString("es-CO")}
                                  </Badge>
                                </div>
                              ))}
                              {userBookings.length > 3 && (
                                <div className="text-xs text-muted-foreground text-center pt-1">
                                  +{userBookings.length - 3} reservas más
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="banned" className="mt-4">
              {bannedUsers.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Ban className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">No hay usuarios baneados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bannedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900"
                    >
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-base sm:text-lg truncate">{user.name}</div>
                            <div className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                              Baneado: {user.banned_at && new Date(user.banned_at).toLocaleDateString("es-CO")}
                            </div>
                            {user.phone && (
                              <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanUser(user.id, user.name)}
                          disabled={isLoading}
                          className="flex-shrink-0 text-xs sm:text-sm"
                        >
                          <ShieldOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Desbanear
                        </Button>
                      </div>

                      {user.banned_reason && (
                        <div className="bg-background/50 rounded-lg p-2 sm:p-3 border border-border/30">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Motivo del baneo:</div>
                          <div className="text-xs sm:text-sm">{user.banned_reason}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            Actividad reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bookings.slice(0, 8).map((booking) => (
              <div
                key={booking.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  booking.cancelled_at
                    ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
                    : "bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {booking.cancelled_at ? (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{booking.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(booking.date).toLocaleDateString("es-CO")} • {booking.from}-{booking.to}
                      {booking.cancelled_at && (
                        <span className="text-red-600 ml-2">
                          • Cancelada {new Date(booking.cancelled_at).toLocaleDateString("es-CO")}
                        </span>
                      )}
                    </div>
                    {booking.cancelled_at && booking.cancellation_reason && (
                      <div className="text-xs text-red-600 mt-1 truncate">Motivo: {booking.cancellation_reason}</div>
                    )}
                  </div>
                </div>
                <Badge variant={booking.cancelled_at ? "destructive" : "outline"} className="flex-shrink-0 text-xs">
                  ${booking.deposit.toLocaleString("es-CO")}
                </Badge>
              </div>
            ))}

            {bookings.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">No hay actividad reciente</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
