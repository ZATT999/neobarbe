export interface User {
  id: number
  name: string
  phone?: string // Added phone field to user interface
  admin?: boolean
  createdAt: string
  lastBooking?: string // Added last booking date tracking
}

export interface Booking {
  id: number
  date: string
  from: string
  to: string
  name: string
  phone: string
  price: number
  deposit: number
  nequi: string
  trxRef?: string
  receipt?: string
  createdAt: string
}

const STORAGE_KEYS = {
  USERS: "barber_users_v1",
  BOOKINGS: "barber_bookings_v1",
  ADMIN_DEVICE: "barber_admin_device",
  CURRENT_USER: "barber_current_user_v1",
  LAST_RESET: "barber_last_reset_v1",
}

export const storage = {
  // User management
  getUsers(): User[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
    } catch {
      return []
    }
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
    this.syncData()
  },

  addUser(user: Omit<User, "id" | "createdAt">): User {
    const users = this.getUsers()
    const newUser: User = {
      ...user,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    }
    users.push(newUser)
    this.saveUsers(users)
    return newUser
  },

  updateUserLastBooking(userName: string, bookingDate: string): void {
    const users = this.getUsers()
    const userIndex = users.findIndex((u) => u.name.toLowerCase() === userName.toLowerCase())

    if (userIndex !== -1) {
      users[userIndex].lastBooking = bookingDate
      this.saveUsers(users)
    }
  },

  getUserBookings(userName: string): Booking[] {
    const bookings = this.getBookings()
    return bookings
      .filter((b) => b.name.toLowerCase() === userName.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  // Current user session
  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    }
  },

  // Admin device management
  isAdminDevice(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_DEVICE) === "true"
  },

  setAdminDevice(isAdmin: boolean): void {
    if (isAdmin) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_DEVICE, "true")
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_DEVICE)
    }
  },

  // Booking management
  getBookings(): Booking[] {
    try {
      this.checkAndResetDaily()
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || "[]")
    } catch {
      return []
    }
  },

  saveBookings(bookings: Booking[]): void {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings))
    this.syncData()
  },

  addBooking(booking: Omit<Booking, "id" | "createdAt">): Booking {
    const bookings = this.getBookings()
    const newBooking: Booking = {
      ...booking,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    }
    bookings.push(newBooking)
    this.saveBookings(bookings)

    this.updateUserLastBooking(booking.name, booking.date)

    return newBooking
  },

  deleteBooking(id: number): void {
    const bookings = this.getBookings().filter((b) => b.id !== id)
    this.saveBookings(bookings)
  },

  // Daily reset functionality
  checkAndResetDaily(): void {
    const today = new Date().toISOString().split("T")[0]
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET)

    if (lastReset !== today) {
      // Reset time slots by clearing old bookings for past dates
      const bookings = this.getBookings()
      const currentBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.date)
        const now = new Date()
        return bookingDate >= now
      })

      this.saveBookings(currentBookings)
      localStorage.setItem(STORAGE_KEYS.LAST_RESET, today)

      console.log("[v0] Daily reset completed - cleared past bookings")
    }
  },

  syncData(): void {
    try {
      // Trigger storage event for cross-tab synchronization
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEYS.BOOKINGS,
          newValue: localStorage.getItem(STORAGE_KEYS.BOOKINGS),
          storageArea: localStorage,
        }),
      )

      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEYS.USERS,
          newValue: localStorage.getItem(STORAGE_KEYS.USERS),
          storageArea: localStorage,
        }),
      )
    } catch (error) {
      console.error("[v0] Error syncing data:", error)
    }
  },

  // Business hours status
  isBusinessHours(): boolean {
    const now = new Date()
    const hour = now.getHours()
    return hour >= 9 && hour <= 22 // 9 AM to 10 PM
  },

  // Next business day reset time
  getNextResetTime(): Date {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0) // 9 AM tomorrow
    return tomorrow
  },
}
