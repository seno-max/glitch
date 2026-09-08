import { format, parseISO, differenceInCalendarDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, addDays, getDay, eachDayOfInterval } from 'date-fns'

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

/** All dates (yyyy-MM-dd) of the current week (Mon-first), in order. */
export function currentWeekDays(date = new Date()): string[] {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end }).map(toDateStr)
}

export function daysBetween(a: string, b: string): number {
  return differenceInCalendarDays(parseISO(b), parseISO(a))
}

export function isConsecutiveDay(prevDateStr: string | null, currentDateStr: string): boolean {
  if (!prevDateStr) return false
  return daysBetween(prevDateStr, currentDateStr) === 1
}

/**
 * Like isConsecutiveDay, but a gap of more than 1 day is still considered
 * "unbroken" if every calendar day strictly between prevDateStr and
 * currentDateStr is a designated rest day (0=Sunday..6=Saturday, matching
 * date-fns getDay()). This is what lets a user's streak survive a rest day
 * they didn't log anything on, while still requiring every *non*-rest day
 * in between to have been logged.
 */
export function isBridgeableGap(prevDateStr: string | null, currentDateStr: string, restDays: number[] = []): boolean {
  if (!prevDateStr) return false
  const diff = daysBetween(prevDateStr, currentDateStr)
  if (diff <= 1) return true
  if (restDays.length === 0) return false
  const start = parseISO(prevDateStr)
  for (let i = 1; i < diff; i++) {
    const between = getDay(addDays(start, i))
    if (!restDays.includes(between)) return false
  }
  return true
}

export function isSameOrBeforeToday(dateStr: string): boolean {
  return dateStr <= todayStr()
}

/**
 * How many days of grace a user has to log/edit/delete an entry after its
 * date before it locks to read-only. E.g. with a value of 2, an entry dated
 * Monday can still be created/edited/deleted on Mon, Tue, or Wed -- from
 * Thursday onward it's locked (view-only), preventing edits to old history
 * while still giving a couple of days' grace for anyone who couldn't log
 * same-day.
 */
export const EDIT_WINDOW_DAYS = 2

/**
 * Whether a date-stamped log entry (workout, meal, weight check-in, etc.)
 * can still be created, edited, or deleted, based on how many days have
 * passed since its date. Future dates are always considered editable.
 */
export function isWithinEditWindow(dateStr: string, asOfDate: string = todayStr()): boolean {
  if (dateStr > asOfDate) return true
  return daysBetween(dateStr, asOfDate) <= EDIT_WINDOW_DAYS
}

/**
 * The earliest date (yyyy-MM-dd) that's still inside the edit window as of
 * `asOfDate` -- use as the `min` on date pickers for creating/backfilling a
 * new entry, so users can't even pick a date that would be locked the
 * moment they hit save.
 */
export function earliestEditableDate(asOfDate: string = todayStr()): string {
  return toDateStr(subDays(parseISO(asOfDate), EDIT_WINDOW_DAYS))
}

/**
 * Given a set of dates (yyyy-MM-dd, any order, duplicates ok) on which an
 * activity was logged, computes the current + longest consecutive-day
 * streak as of `asOfDate`. This recomputes from the *entire* history every
 * time rather than incrementally mutating a saved counter — so backfilling
 * an older/out-of-order date (e.g. logging a workout today and then going
 * back to backfill a workout from last week) can never corrupt an
 * already-established streak.
 *
 * `restDays` (0=Sunday..6=Saturday) are weekdays the user has designated
 * as rest days — a gap that only spans rest days doesn't break the streak
 * (see isBridgeableGap), so e.g. going to the gym Mon-Sat and resting on a
 * designated Sunday still gives a 7-day streak come next Monday.
 *
 * "Current streak" only counts if the most recent logged date is today or
 * bridgeable to today (i.e. any gap to today is entirely rest days) —
 * otherwise the streak has lapsed and is 0.
 */
export function computeStreakFromDates(dates: string[], asOfDate: string, restDays: number[] = []): { current: number; longest: number } {
  const unique = Array.from(new Set(dates)).sort()
  if (unique.length === 0) return { current: 0, longest: 0 }

  let longest = 1
  let run = 1
  for (let i = 1; i < unique.length; i++) {
    run = isBridgeableGap(unique[i - 1], unique[i], restDays) ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  const lastDate = unique[unique.length - 1]
  let current = 0
  if (isBridgeableGap(lastDate, asOfDate, restDays)) {
    current = 1
    for (let i = unique.length - 1; i > 0; i--) {
      if (isBridgeableGap(unique[i - 1], unique[i], restDays)) current += 1
      else break
    }
  }
  return { current, longest }
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
