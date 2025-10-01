export interface TimeSlot {
  start: string
  end: string
  startMinutes: number
  endMinutes: number
  available: boolean
  bookedBy?: string
}

export const TIME_CONFIG = {
  OPENING_HOUR: 9,
  CLOSING_HOUR: 22, // Extended closing time from 18 (6 PM) to 22 (10 PM)
  SLOT_DURATION: 35, // Changed from 40 to 35 minutes per appointment
  NEQUI_NUMBER: "3015378286",
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function generateTimeSlots(date: string, existingBookings: any[] = []): TimeSlot[] {
  const slots: TimeSlot[] = []
  const startMinutes = TIME_CONFIG.OPENING_HOUR * 60
  const endMinutes = TIME_CONFIG.CLOSING_HOUR * 60

  // Generate all possible slots
  for (
    let current = startMinutes;
    current + TIME_CONFIG.SLOT_DURATION <= endMinutes;
    current += TIME_CONFIG.SLOT_DURATION
  ) {
    const start = minutesToTime(current)
    const end = minutesToTime(current + TIME_CONFIG.SLOT_DURATION)

    // Check if this slot is already booked
    const booking = existingBookings.find((b) => b.date === date && b.from === start)

    slots.push({
      start,
      end,
      startMinutes: current,
      endMinutes: current + TIME_CONFIG.SLOT_DURATION,
      available: !booking,
      bookedBy: booking?.name,
    })
  }

  return slots
}

export function isSlotAvailable(date: string, startTime: string, existingBookings: any[]): boolean {
  return !existingBookings.some((booking) => booking.date === date && booking.from === startTime)
}

export function getNextAvailableSlot(date: string, existingBookings: any[]): TimeSlot | null {
  const slots = generateTimeSlots(date, existingBookings)
  return slots.find((slot) => slot.available) || null
}

export function formatSlotTime(slot: TimeSlot): string {
  return `${slot.start} - ${slot.end}`
}

export function isValidBookingTime(date: string, time: string): boolean {
  const bookingDate = new Date(date)
  const now = new Date()

  // Can't book in the past
  if (bookingDate < now) {
    return false
  }

  // If booking for today, check if time hasn't passed
  if (bookingDate.toDateString() === now.toDateString()) {
    const [hours, minutes] = time.split(":").map(Number)
    const bookingTime = new Date()
    bookingTime.setHours(hours, minutes, 0, 0)

    return bookingTime > now
  }

  return true
}

export function getCurrentTimeSlots(date: string, existingBookings: any[] = []): TimeSlot[] {
  const slots = generateTimeSlots(date, existingBookings)

  // Return all slots regardless of current time
  return slots
}

export function getNextAvailableSlotFromNow(date: string, existingBookings: any[]): TimeSlot | null {
  const currentSlots = getCurrentTimeSlots(date, existingBookings)
  return currentSlots.find((slot) => slot.available) || null
}
