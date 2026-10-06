// Display helpers. Database stores UTC; UI always shows Asia/Jakarta.

export const APP_TIMEZONE = 'Asia/Jakarta'
const JAKARTA_OFFSET = '+07:00' // WIB has no DST

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '-'
  return new Date(value).toLocaleTimeString('id-ID', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Current Jakarta wall-clock time formatted for <input type="datetime-local">. */
export function nowForDateTimeInput(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/** Interpret a datetime-local value as Jakarta time and return a UTC ISO string. */
export function jakartaInputToUtcIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return null
  const withSeconds = value.length === 16 ? `${value}:00` : value
  const date = new Date(`${withSeconds}${JAKARTA_OFFSET}`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function humanize(value: string | null | undefined): string {
  if (!value) return '-'
  return value.replace(/_/g, ' ')
}
