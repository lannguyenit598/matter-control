/** Calendar arithmetic uses UTC dates only; time-zone/instant validation stays in local-time.ts. */
export function calendarDate(value: string): Date {
  return new Date(`${value}T12:00:00Z`)
}

export function dateKey(date: Date): string {
  const year = date.getUTCFullYear()
  return year >= 1 && year <= 9999 ? date.toISOString().slice(0, 10) : ''
}

export function moveCalendarDate(value: string, days: number, months = 0): string {
  const date = calendarDate(value)
  const day = date.getUTCDate()
  if (months) {
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() + months)
    const last = new Date(date)
    last.setUTCMonth(last.getUTCMonth() + 1, 0)
    date.setUTCDate(Math.min(day, last.getUTCDate()))
  }
  date.setUTCDate(date.getUTCDate() + days)
  return dateKey(date)
}

/** Six Monday-first weeks keep navigation geometry stable between months. */
export function calendarDays(month: string): string[][] {
  const first = calendarDate(`${month}-01`)
  first.setUTCDate(1 - ((first.getUTCDay() + 6) % 7))
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = new Date(first)
      date.setUTCDate(date.getUTCDate() + week * 7 + day)
      return dateKey(date)
    }),
  )
}
