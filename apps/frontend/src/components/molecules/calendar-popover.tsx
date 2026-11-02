'use client'

import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { useLocale } from '@/hooks/use-locale'
import { calendarDate, calendarDays, moveCalendarDate } from '@/lib/calendar'
import { instantToLocal } from '@/lib/mc/local-time'

/** A top-layer popover stays above a parent dialog without clipping or a second modal trap. */
export function CalendarPopover({
  readValue,
  onApply,
  zone,
  label,
  disabled,
}: {
  readValue: () => string
  onApply: (value: string) => void
  zone: string
  label: string
  disabled?: boolean
}) {
  const vi = useLocale() === 'vi'
  const locale = vi ? 'vi-VN' : 'en-GB'
  const id = useId()
  const popup = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const focusRequested = useRef(false)
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('00:00')
  const [month, setMonth] = useState('2026-01')
  const [focused, setFocused] = useState('')
  const [today, setToday] = useState('')
  const text = (en: string, vn: string) => (vi ? vn : en)

  useEffect(() => {
    if (open && focusRequested.current) {
      popup.current?.querySelector<HTMLButtonElement>('[data-calendar-day][tabindex="0"]')?.focus()
      focusRequested.current = false
    }
  }, [open, focused, month])

  function close() {
    popup.current?.hidePopover()
    trigger.current?.focus()
  }

  function moveFocus(next: string) {
    if (!next) return
    focusRequested.current = true
    setFocused(next)
    setMonth(next.slice(0, 7))
  }

  function onDayKey(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    let next = ''
    const weekday = (calendarDate(day).getUTCDay() + 6) % 7
    switch (event.key) {
      case 'ArrowLeft':
        next = moveCalendarDate(day, -1)
        break
      case 'ArrowRight':
        next = moveCalendarDate(day, 1)
        break
      case 'ArrowUp':
        next = moveCalendarDate(day, -7)
        break
      case 'ArrowDown':
        next = moveCalendarDate(day, 7)
        break
      case 'Home':
        next = moveCalendarDate(day, -weekday)
        break
      case 'End':
        next = moveCalendarDate(day, 6 - weekday)
        break
      case 'PageUp':
        next = moveCalendarDate(day, 0, event.shiftKey ? -12 : -1)
        break
      case 'PageDown':
        next = moveCalendarDate(day, 0, event.shiftKey ? 12 : 1)
        break
      default:
        return
    }
    event.preventDefault()
    moveFocus(next)
  }

  return (
    <>
      <Button
        ref={trigger}
        variant="ghost"
        size="icon"
        className="calendar-trigger"
        aria-label={label}
        aria-haspopup="dialog"
        popoverTarget={id}
        disabled={disabled}
        onClick={() => {
          // Keep native entry usable on browsers without the Popover API.
          if (!popup.current?.showPopover) {
            trigger.current?.parentElement?.querySelector<HTMLInputElement>('input')?.showPicker?.()
          }
        }}
      >
        <CalendarDays aria-hidden />
      </Button>
      <div
        ref={popup}
        id={id}
        popover="auto"
        role="dialog"
        aria-label={text('Choose date and time', 'Chọn ngày và giờ')}
        className="calendar-popover"
        onBeforeToggle={(event) => {
          if (event.newState !== 'open') return
          const now = instantToLocal(new Date().toISOString(), zone)
          const value = readValue()
          const storedDate = /^\d{4}-\d{2}-\d{2}T/.test(value) ? value.slice(0, 10) : ''
          const chosen = storedDate || now.slice(0, 10)
          setToday(now.slice(0, 10))
          setDate(storedDate)
          setTime(value.slice(11, 16) || '00:00')
          setMonth(chosen.slice(0, 7))
          setFocused(chosen)
          focusRequested.current = true
        }}
        onToggle={(event) => setOpen(event.newState === 'open')}
      >
        {open && (
          <>
            <div className="calendar-heading">
              <strong id={`${id}-month`} aria-live="polite">
                {new Intl.DateTimeFormat(locale, {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                }).format(calendarDate(`${month}-01`))}
              </strong>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={text('Previous month', 'Tháng trước')}
                  disabled={month === '0001-01'}
                  onClick={() => {
                    const next = moveCalendarDate(`${month}-01`, 0, -1)
                    setMonth(next.slice(0, 7))
                    setFocused(next)
                  }}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={text('Next month', 'Tháng sau')}
                  disabled={month === '9999-12'}
                  onClick={() => {
                    const next = moveCalendarDate(`${month}-01`, 0, 1)
                    setMonth(next.slice(0, 7))
                    setFocused(next)
                  }}
                >
                  <ChevronRight aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={text('Close calendar', 'Đóng lịch')}
                  onClick={close}
                >
                  <X aria-hidden />
                </Button>
              </div>
            </div>
            <table role="grid" aria-labelledby={`${id}-month`} className="calendar-grid">
              <thead>
                <tr>
                  {Array.from({ length: 7 }, (_, i) => (
                    <th key={i} scope="col">
                      {new Intl.DateTimeFormat(locale, {
                        weekday: 'short',
                        timeZone: 'UTC',
                      }).format(calendarDate(`2026-06-${String(i + 1).padStart(2, '0')}`))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarDays(month).map((week, w) => (
                  <tr key={w}>
                    {week.map((day, d) => (
                      <td key={d} role="gridcell" aria-selected={Boolean(day && day === date)}>
                        {day && (
                          <button
                            type="button"
                            data-calendar-day
                            data-outside={day.slice(0, 7) !== month || undefined}
                            tabIndex={day === focused ? 0 : -1}
                            aria-label={new Intl.DateTimeFormat(locale, {
                              dateStyle: 'full',
                              timeZone: 'UTC',
                            }).format(calendarDate(day))}
                            aria-current={day === today ? 'date' : undefined}
                            onKeyDown={(event) => onDayKey(event, day)}
                            onClick={() => {
                              setDate(day)
                              moveFocus(day)
                            }}
                          >
                            {calendarDate(day).getUTCDate()}
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="calendar-time">
              <label htmlFor={`${id}-time`}>
                <Clock3 aria-hidden />
                {text('Time', 'Giờ')}
              </label>
              <Input
                id={`${id}-time`}
                type="time"
                value={time}
                onChange={(event) => setTime(event.currentTarget.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">{zone}</p>
            <div className="calendar-footer">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDate(today)
                  setMonth(today.slice(0, 7))
                  setFocused(today)
                }}
              >
                {text('Today', 'Hôm nay')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onApply('')
                  close()
                }}
              >
                {text('Clear', 'Xóa')}
              </Button>
              <Button
                size="sm"
                disabled={!date || !time}
                onClick={() => {
                  onApply(`${date}T${time}`)
                  close()
                }}
              >
                {text('Apply', 'Áp dụng')}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
