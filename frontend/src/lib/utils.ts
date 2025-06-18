import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function calculateAttendancePercentage(present: number, total: number) {
  if (total === 0) return 0
  return Math.round((present / total) * 100)
}

export function getAttendanceColor(percentage: number) {
  if (percentage >= 90) return 'text-green-600'
  if (percentage >= 75) return 'text-yellow-600'
  return 'text-red-600'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function isCurrentTimeInRange(startTime: string, endTime: string) {
  const now = new Date()
  const currentTime = now.toTimeString().substring(0, 5) // HH:MM format
  
  return currentTime >= startTime && currentTime <= endTime
}

export function getSessionStatus(session: 'FN' | 'AN', eventDay: any) {
  const now = new Date()
  const currentTime = now.toTimeString().substring(0, 5)
  const currentDate = now.toDateString()
  const eventDate = new Date(eventDay.date).toDateString()
  
  if (currentDate !== eventDate) {
    return 'inactive'
  }
  
  const startTime = session === 'FN' ? eventDay.fnStartTime : eventDay.anStartTime
  const endTime = session === 'FN' ? eventDay.fnEndTime : eventDay.anEndTime
  
  if (currentTime < startTime) {
    return 'upcoming'
  } else if (currentTime >= startTime && currentTime <= endTime) {
    return 'active'
  } else {
    return 'ended'
  }
}