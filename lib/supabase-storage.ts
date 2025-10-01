import { createClient } from "@/lib/supabase/client"
import { sendBookingNotification, sendCancellationNotification } from "@/lib/sms-notifications"
import { sendBookingEmailNotification, sendCancellationEmailNotification } from "@/lib/email-notifications"
import { sendWhatsAppBookingNotification, sendWhatsAppCancellationNotification } from "@/lib/whatsapp-notifications"

export interface User {
  id: string
  name: string
  phone?: string
  admin?: boolean
  created_at: string
  last_booking?: string
  rol?: string
  is_banned?: boolean
  banned_at?: string
  banned_reason?: string
  banned_by?: string
}

export interface Booking {
  id: string
  date: string
  from: string
  to: string
  name: string
  phone: string
  price: number
  deposit: number
  nequi: string
  trx_ref?: string
  receipt?: string
  created_at: string
  user_id?: string
  service_id?: string
  service_type?: string
  cancelled_at?: string
  cancellation_reason?: string
}

export interface Service {
  id: string
  name: string
  duration: number
  price: number
  description?: string
  active: boolean
  created_at: string
}

export const supabaseStorage = {
  createClient() {
    return createClient()
  },

  // User management
  async getUsers(): Promise<User[]> {
    try {
      const supabase = this.createClient()
      const query = supabase.from("barbershop_users").select("*").order("creado_en", { ascending: false })

      const { data, error } = await query

      if (error) {
        if (error.message.includes("Could not find the table")) {
          console.log("[v0] Users table not yet created")
          return []
        }
        if (error.message.includes("is_banned") || error.message.includes("banned_")) {
          console.log("[v0] Ban columns not yet created, fetching without them")
          const { data: basicData, error: basicError } = await supabase
            .from("barbershop_users")
            .select("id, nombre, telefono, admin, creado_en, rol, last_booking")
            .order("creado_en", { ascending: false })

          if (basicError) {
            console.error("[v0] Error fetching users:", basicError)
            return []
          }

          return (basicData || []).map((user) => ({
            id: user.id,
            name: user.nombre,
            phone: user.telefono,
            admin: user.admin,
            created_at: user.creado_en,
            last_booking: user.last_booking,
            rol: user.rol,
            is_banned: false,
          }))
        }
        console.error("[v0] Error fetching users:", error)
        return []
      }

      console.log("[v0] Fetched users from database:", data?.length || 0)

      return (data || []).map((user) => ({
        id: user.id,
        name: user.nombre,
        phone: user.telefono,
        admin: user.admin,
        created_at: user.creado_en,
        last_booking: user.last_booking,
        rol: user.rol,
        is_banned: user.is_banned || false,
        banned_at: user.banned_at,
        banned_reason: user.banned_reason,
        banned_by: user.banned_by,
      }))
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
      return []
    }
  },

  async addUser(user: Omit<User, "id" | "created_at">): Promise<User | null> {
    try {
      const supabase = this.createClient()
      const dbUser = {
        nombre: user.name,
        telefono: user.phone,
        admin: user.admin || false,
        rol: user.admin ? "admin" : "cliente",
      }

      const { data, error } = await supabase.from("barbershop_users").insert([dbUser]).select().single()

      if (error) {
        if (error.message.includes("Could not find the table")) {
          console.log("[v0] Users table not yet created")
          return null
        }
        console.error("[v0] Error adding user:", error)
        return null
      }

      return {
        id: data.id,
        name: data.nombre,
        phone: data.telefono,
        admin: data.admin,
        created_at: data.creado_en,
        rol: data.rol,
        is_banned: data.is_banned,
      }
    } catch (error) {
      console.error("[v0] Error adding user:", error)
      return null
    }
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const supabase = this.createClient()
    const dbUpdates: any = {}
    if (updates.name) dbUpdates.nombre = updates.name
    if (updates.phone) dbUpdates.telefono = updates.phone
    if (updates.admin !== undefined) {
      dbUpdates.admin = updates.admin
      dbUpdates.rol = updates.admin ? "admin" : "cliente"
    }

    const { data, error } = await supabase.from("barbershop_users").update(dbUpdates).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating user:", error)
      return null
    }

    return {
      id: data.id,
      name: data.nombre,
      phone: data.telefono,
      admin: data.admin,
      created_at: data.creado_en,
      last_booking: data.last_booking,
      rol: data.rol,
      is_banned: data.is_banned,
      banned_at: data.banned_at,
      banned_reason: data.banned_reason,
      banned_by: data.banned_by,
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      const supabase = this.createClient()

      // First, get user data for cancelling appointments
      const { data: userData, error: fetchError } = await supabase
        .from("barbershop_users")
        .select("nombre")
        .eq("id", id)
        .single()

      if (fetchError) {
        console.error("[v0] Error fetching user for deletion:", fetchError)
        return false
      }

      if (userData) {
        // Cancel all future appointments for this user
        const { error: cancelError } = await supabase
          .from("appointments")
          .update({
            cancelled_at: new Date().toISOString(),
            cancellation_reason: "Usuario eliminado por administrador",
          })
          .eq("name", userData.nombre)
          .gte("date", new Date().toISOString().split("T")[0])
          .is("cancelled_at", null)

        if (cancelError) {
          console.error("[v0] Error cancelling user appointments:", cancelError)
        }
      }

      // Delete the user
      const { error: deleteError } = await supabase.from("barbershop_users").delete().eq("id", id)

      if (deleteError) {
        console.error("[v0] Error deleting user from database:", deleteError)
        return false
      }

      console.log("[v0] User deleted successfully from database")
      return true
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      return false
    }
  },

  async banUser(id: string, reason: string, bannedBy?: string): Promise<boolean> {
    try {
      const supabase = this.createClient()

      const { error } = await supabase.rpc("ban_user", {
        user_id_param: id,
        reason_param: reason,
        banned_by_param: bannedBy || null,
      })

      if (error) {
        console.error("[v0] Error banning user:", error)
        return false
      }

      console.log("[v0] User banned successfully")
      return true
    } catch (error) {
      console.error("[v0] Error banning user:", error)
      return false
    }
  },

  async unbanUser(id: string): Promise<boolean> {
    try {
      const supabase = this.createClient()

      const { error } = await supabase.rpc("unban_user", {
        user_id_param: id,
      })

      if (error) {
        console.error("[v0] Error unbanning user:", error)
        return false
      }

      console.log("[v0] User unbanned successfully")
      return true
    } catch (error) {
      console.error("[v0] Error unbanning user:", error)
      return false
    }
  },

  async isUserBanned(userId: string): Promise<boolean> {
    try {
      const supabase = this.createClient()

      const { data, error } = await supabase.rpc("is_user_banned", {
        user_id_param: userId,
      })

      if (error) {
        console.error("[v0] Error checking ban status:", error)
        return false
      }

      return data || false
    } catch (error) {
      console.error("[v0] Error checking ban status:", error)
      return false
    }
  },

  async updateUserLastBooking(userName: string, bookingDate: string): Promise<void> {
    const supabase = this.createClient()
    const { error } = await supabase
      .from("barbershop_users")
      .update({ last_booking: bookingDate })
      .ilike("nombre", userName)

    if (error) {
      console.error("[v0] Error updating user last booking:", error)
    }
  },

  async getUserBookings(userName: string): Promise<Booking[]> {
    const supabase = this.createClient()
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .ilike("name", userName)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching user bookings:", error)
      return []
    }

    return data || []
  },

  // Booking management
  async getBookings(): Promise<Booking[]> {
    const supabase = this.createClient()
    const { data, error } = await supabase.from("appointments").select("*").order("date", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching bookings:", error)
      return []
    }

    return data || []
  },

  async addBooking(booking: Omit<Booking, "id" | "created_at">): Promise<Booking | null> {
    const supabase = this.createClient()
    const { data, error } = await supabase.from("appointments").insert([booking]).select().single()

    if (error) {
      console.error("[v0] Error adding booking:", error)
      return null
    }

    if (data && booking.service_type) {
      try {
        await sendBookingNotification(
          booking.name,
          booking.phone,
          booking.service_type,
          booking.date,
          `${booking.from} - ${booking.to}`,
          booking.price,
        )
        console.log("[v0] SMS notification sent for new booking")

        await sendBookingEmailNotification(
          booking.name,
          booking.phone,
          booking.service_type,
          booking.date,
          `${booking.from} - ${booking.to}`,
          booking.price,
        )
        console.log("[v0] Email notification sent for new booking")

        await sendWhatsAppBookingNotification(
          booking.name,
          booking.phone,
          booking.service_type,
          booking.date,
          `${booking.from} - ${booking.to}`,
          booking.price,
        )
        console.log("[v0] WhatsApp notification sent for new booking")
      } catch (error) {
        console.error("[v0] Error sending notifications:", error)
      }
    }

    if (data) {
      await this.updateUserLastBooking(booking.name, booking.date)
    }

    return data
  },

  async deleteBooking(id: string): Promise<boolean> {
    const supabase = this.createClient()

    const { data: bookingData } = await supabase.from("appointments").select("*").eq("id", id).single()

    const { error } = await supabase.from("appointments").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting booking:", error)
      return false
    }

    if (bookingData) {
      try {
        await sendCancellationNotification(
          bookingData.name,
          bookingData.phone,
          bookingData.service_type || "Corte de cabello",
          bookingData.date,
          `${bookingData.from} - ${bookingData.to}`,
          "Cancelada por administrador",
        )
        console.log("[v0] SMS notification sent for booking cancellation")

        await sendCancellationEmailNotification(
          bookingData.name,
          bookingData.phone,
          bookingData.service_type || "Corte de cabello",
          bookingData.date,
          `${bookingData.from} - ${bookingData.to}`,
          "Cancelada por administrador",
        )
        console.log("[v0] Email notification sent for booking cancellation")

        await sendWhatsAppCancellationNotification(
          bookingData.name,
          bookingData.phone,
          bookingData.service_type || "Corte de cabello",
          bookingData.date,
          `${bookingData.from} - ${bookingData.to}`,
          "Cancelada por administrador",
        )
        console.log("[v0] WhatsApp notification sent for booking cancellation")
      } catch (error) {
        console.error("[v0] Error sending cancellation notifications:", error)
      }
    }

    return true
  },

  async cancelBooking(id: string, reason?: string): Promise<boolean> {
    const supabase = this.createClient()

    const { data: booking } = await supabase.from("appointments").select("*").eq("id", id).single()

    if (!booking) {
      console.error("[v0] Booking not found for cancellation")
      return false
    }

    const { error } = await supabase
      .from("appointments")
      .update({
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || "Cancelada por cliente",
      })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error cancelling booking:", error)
      return false
    }

    try {
      await sendCancellationNotification(
        booking.name,
        booking.phone,
        booking.service_type || "Corte de cabello",
        booking.date,
        `${booking.from} - ${booking.to}`,
        reason,
      )
      console.log("[v0] SMS notification sent for booking cancellation")

      await sendCancellationEmailNotification(
        booking.name,
        booking.phone,
        booking.service_type || "Corte de cabello",
        booking.date,
        `${booking.from} - ${booking.to}`,
        reason,
      )
      console.log("[v0] Email notification sent for booking cancellation")

      await sendWhatsAppCancellationNotification(
        booking.name,
        booking.phone,
        booking.service_type || "Corte de cabello",
        booking.date,
        `${booking.from} - ${booking.to}`,
        reason,
      )
      console.log("[v0] WhatsApp notification sent for booking cancellation")
    } catch (error) {
      console.error("[v0] Error sending cancellation notifications:", error)
    }

    return true
  },

  async canCancelBooking(id: string): Promise<{ canCancel: boolean; reason?: string }> {
    const supabase = this.createClient()

    const { data: booking } = await supabase.from("appointments").select("*").eq("id", id).single()

    if (!booking) {
      return { canCancel: false, reason: "Reserva no encontrada" }
    }

    if (booking.cancelled_at) {
      return { canCancel: false, reason: "Esta reserva ya fue cancelada" }
    }

    const bookingTime = new Date(booking.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - bookingTime.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 1) {
      return {
        canCancel: false,
        reason: "Solo puedes cancelar dentro de la primera hora después de hacer la reserva",
      }
    }

    const appointmentDate = new Date(`${booking.date}T${booking.from}:00`)
    if (appointmentDate < now) {
      return { canCancel: false, reason: "No puedes cancelar citas pasadas" }
    }

    return { canCancel: true }
  },

  async getBookingsForDate(date: string): Promise<Booking[]> {
    const supabase = this.createClient()
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("date", date)
      .is("cancelled_at", null)
      .order("from", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching bookings for date:", error)
      return []
    }

    return data || []
  },

  // Services management
  async getServices(): Promise<Service[]> {
    const supabase = this.createClient()
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching services:", error)
      return []
    }

    return data || []
  },

  async addService(service: Omit<Service, "id" | "created_at">): Promise<Service | null> {
    const supabase = this.createClient()
    const { data, error } = await supabase.from("services").insert([service]).select().single()

    if (error) {
      console.error("[v0] Error adding service:", error)
      return null
    }

    return data
  },

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === "undefined") return null

    try {
      // Check localStorage first for session persistence
      const storedUser = localStorage.getItem("barber_current_user")
      if (storedUser) {
        const user = JSON.parse(storedUser)
        // Verify user still exists in database
        const supabase = this.createClient()
        const { data } = await supabase
          .from("barbershop_users")
          .select("id, nombre, telefono, admin, creado_en, rol")
          .eq("id", user.id)
          .single()

        if (data) {
          let isBanned = false
          let bannedAt = undefined
          let bannedReason = undefined

          try {
            const { data: banData } = await supabase
              .from("barbershop_users")
              .select("is_banned, banned_at, banned_reason")
              .eq("id", user.id)
              .single()

            if (banData) {
              isBanned = banData.is_banned || false
              bannedAt = banData.banned_at
              bannedReason = banData.banned_reason
            }
          } catch (banError) {
            // Ban columns don't exist yet
            console.log("[v0] Ban columns not available")
          }

          return {
            id: data.id,
            name: data.nombre,
            phone: data.telefono,
            admin: data.admin,
            created_at: data.creado_en,
            rol: data.rol,
            is_banned: isBanned,
            banned_at: bannedAt,
            banned_reason: bannedReason,
          }
        } else {
          // User no longer exists, clear localStorage
          localStorage.removeItem("barber_current_user")
        }
      }
    } catch (error) {
      console.error("[v0] Error getting current user from localStorage:", error)
    }

    return null
  },

  async setCurrentUser(user: User | null): Promise<void> {
    if (typeof window === "undefined") return

    if (user) {
      localStorage.setItem("barber_current_user", JSON.stringify(user))
    } else {
      localStorage.removeItem("barber_current_user")
    }
  },

  isAdminDevice(): boolean {
    if (typeof window === "undefined") return false
    return localStorage.getItem("barber_admin_device") === "true"
  },

  setAdminDevice(isAdmin: boolean): void {
    if (typeof window === "undefined") return
    if (isAdmin) {
      localStorage.setItem("barber_admin_device", "true")
    } else {
      localStorage.removeItem("barber_admin_device")
    }
  },

  isBusinessHours(): boolean {
    const now = new Date()
    const hour = now.getHours()
    return hour >= 9 && hour <= 22
  },

  async cleanupOldBookings(): Promise<void> {
    // No longer cleaning up old bookings - keep them for historical records
    console.log("[v0] Bookings are now persistent - no cleanup needed")
  },

  async checkDatabaseTables(): Promise<boolean> {
    try {
      const supabase = this.createClient()
      const { error: usersError } = await supabase.from("barbershop_users").select("count", { count: "exact" }).limit(1)
      const { error: appointmentsError } = await supabase
        .from("appointments")
        .select("count", { count: "exact" })
        .limit(1)
      const { error: servicesError } = await supabase.from("services").select("count", { count: "exact" }).limit(1)

      return !usersError && !appointmentsError && !servicesError
    } catch (error) {
      console.error("[v0] Error checking database tables:", error)
      return false
    }
  },

  async createAdminUser(name: string, phone?: string): Promise<string | null> {
    try {
      const supabase = this.createClient()
      const { data: adminId, error } = await supabase.rpc("get_or_create_admin_user", {
        admin_email: "admin@barberia.com",
        admin_name: name,
        admin_phone: phone || "+1234567890",
      })

      if (error) {
        console.error("[v0] Error creating admin user:", error)
        return null
      }

      return adminId
    } catch (error) {
      console.error("[v0] Error creating admin user:", error)
      return null
    }
  },

  async checkAppointmentConflict(
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<boolean> {
    try {
      const supabase = this.createClient()
      const { data, error } = await supabase.rpc("check_appointment_conflict", {
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        exclude_id: excludeId || null,
      })

      if (error) {
        console.error("[v0] Error checking appointment conflict:", error)
        return true
      }

      return data || false
    } catch (error) {
      console.error("[v0] Error checking appointment conflict:", error)
      return true
    }
  },

  async getAvailableSlots(date: string, serviceDuration = 30): Promise<{ slot_time: string; available: boolean }[]> {
    try {
      const supabase = this.createClient()
      const { data, error } = await supabase.rpc("get_available_slots", {
        appointment_date: date,
        service_duration: serviceDuration,
      })

      if (error) {
        console.error("[v0] Error getting available slots:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("[v0] Error getting available slots:", error)
      return []
    }
  },
}

// Legacy storage interface for backward compatibility
export const storage = {
  getUsers: () => supabaseStorage.getUsers(),
  saveUsers: async (users: User[]) => {
    console.warn("[v0] saveUsers is deprecated - use addUser/updateUser instead")
  },
  addUser: (user: Omit<User, "id" | "created_at">) => supabaseStorage.addUser(user),
  updateUserLastBooking: (userName: string, bookingDate: string) =>
    supabaseStorage.updateUserLastBooking(userName, bookingDate),
  getUserBookings: (userName: string) => supabaseStorage.getUserBookings(userName),
  getCurrentUser: () => supabaseStorage.getCurrentUser(),
  setCurrentUser: (user: User | null) => supabaseStorage.setCurrentUser(user),
  isAdminDevice: () => supabaseStorage.isAdminDevice(),
  setAdminDevice: (isAdmin: boolean) => supabaseStorage.setAdminDevice(isAdmin),
  getBookings: () => supabaseStorage.getBookings(),
  saveBookings: async (bookings: Booking[]) => {
    console.warn("[v0] saveBookings is deprecated - use addBooking/deleteBooking instead")
  },
  addBooking: (booking: Omit<Booking, "id" | "created_at">) => supabaseStorage.addBooking(booking),
  deleteBooking: (id: string) => supabaseStorage.deleteBooking(id),
  checkAndResetDaily: () => supabaseStorage.cleanupOldBookings(),
  syncData: () => {
    console.log("[v0] Data sync handled by Supabase real-time")
  },
  isBusinessHours: () => supabaseStorage.isBusinessHours(),
  getNextResetTime: () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    return tomorrow
  },
}
