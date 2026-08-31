import { format, parseISO, differenceInCalendarDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from 'date-fns'

export const DATE_FMT = 'yyyy-MM-dd'

export function todayStr(): string {
  return format(new Date(), DATE_FMT)
}

export function toDateStr(date: Date): string {
  return format(date, DATE_FMT)
}

export function parseDate(dateStr: string): Date {
  return parseISO(dateStr)
}

export function formatDisplayDate(dateStr: string, fmt = 'EEEE, MMM d'): string {
  return format(parseISO(dateStr), fmt)
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Good Night'
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  if (hour < 21) return 'Good Evening'
  return 'Good Night'
}

export function weekRange(date = new Date()): { start: string; end: string } {
  return {
    start: toDateStr(startOfWeek(date, { weekStartsOn: 1 })),
    end: toDateStr(endOfWeek(date, { weekStartsOn: 1 })),
  }
}

export function monthRange(date = new Date()): { start: string; end: string } {
  return { start: toDateStr(startOfMonth(date)), end: toDateStr(endOfMonth(date)) }
}

export function yearRange(date = new Date()): { start: string; end: string } {
  return { start: toDateStr(startOfYear(date)), end: toDateStr(endOfYear(date)) }
}

export function lastNDaysRange(n: number, date = new Date()): { start: string; end: string } {
  return { start: toDateStr(subDays(date, n - 1)), end: toDateStr(date) }
}

export function daysBetween(a: string, b: string): number {
  return differenceInCalendarDays(parseISO(b), parseISO(a))
}

export function isConsecutiveDay(prevDateStr: string | null, currentDateStr: string): boolean {
  if (!prevDateStr) return false
  return daysBetween(prevDateStr, currentDateStr) === 1
}

export function isSameOrBeforeToday(dateStr: string): boolean {
  return dateStr <= todayStr()
}

/**
 * Formats a duration given in minutes as a friendly "1 hr 36 mins" style string.
 * Used for the manual gym-log entry/exit time workflow.
 */
export function formatDurationHM(totalMinutes: number | null | undefined): string {
  if (totalMinutes === null || totalMinutes === undefined || Number.isNaN(totalMinutes)) return '—'
  const rounded = Math.max(0, Math.round(totalMinutes))
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  if (h > 0 && m > 0) return `${h} hr ${m} min${m === 1 ? '' : 's'}`
  if (h > 0) return `${h} hr`
  return `${m} min${m === 1 ? '' : 's'}`
}
