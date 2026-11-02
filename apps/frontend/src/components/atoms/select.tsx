'use client'

import { Check, ChevronDown } from 'lucide-react'
import {
  useEffect,
  useLayoutEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'
import { fieldControlClass } from './input'

export type SelectOption = { value: string; label: ReactNode; disabled?: boolean }
export type SelectProps = ComponentProps<'select'> & {
  options: readonly SelectOption[]
  leadingIcon?: ReactNode
  placeholder?: ReactNode
}

/** One native form field; the top-layer list replaces only the platform picker. */
export function Select({
  className,
  options,
  placeholder,
  leadingIcon,
  ref,
  ...props
}: SelectProps) {
  const id = useId()
  const field = useRef<HTMLSelectElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const typed = useRef({ value: '', at: 0 })
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [label, setLabel] = useState('')
  const [selected, setSelected] = useState('')
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState<CSSProperties>({})
  const choices =
    placeholder === undefined ? options : [{ value: '', label: placeholder }, ...options]

  function close() {
    popup.current?.hidePopover?.()
    setOpen(false)
  }
  function show() {
    const select = field.current
    // shortcut: old browsers and multi-selects keep native behavior; enhance when Popover exists.
    if (
      !select ||
      typeof HTMLElement.prototype.showPopover !== 'function' ||
      select.matches(':disabled') ||
      props.multiple ||
      (props.size ?? 1) > 1
    )
      return false
    const rect = select.getBoundingClientRect()
    const below = innerHeight - rect.bottom - 8,
      above = rect.top - 8
    const height = Math.max(44, Math.min(320, Math.max(below, above)))
    const width = Math.min(Math.max(rect.width, 160), innerWidth - 16)
    setPosition({
      width: `${width}px`,
      maxHeight: `${height}px`,
      left: `${Math.max(8, Math.min(rect.left, innerWidth - width - 8))}px`,
      top: below >= Math.min(180, height) ? `${rect.bottom + 6}px` : 'auto',
      bottom:
        below >= Math.min(180, height) ? 'auto' : `${Math.max(8, innerHeight - rect.top + 6)}px`,
    })
    setLabel(
      props['aria-label'] ??
        Array.from(select.labels ?? [])
          .map((l) => {
            const copy = l.cloneNode(true) as HTMLElement
            copy
              .querySelectorAll('select, [popover], [aria-hidden="true"]')
              .forEach((node) => node.remove())
            return copy.textContent
          })
          .join(' ')
          .trim(),
    )
    const selectedIndex = select.selectedIndex
    setSelected(select.value)
    setActive(
      selectedIndex >= 0 && !choices[selectedIndex]?.disabled
        ? selectedIndex
        : choices.findIndex((o) => !o.disabled),
    )
    typed.current = { value: '', at: 0 }
    select.focus({ preventScroll: true })
    // Keep the popup outside a wrapping label, but inside any modal dialog for inertness.
    setContainer(select.closest('dialog') ?? document.body)
    setOpen(true)
    return true
  }
  function choose(index: number) {
    const select = field.current,
      option = choices[index]
    if (!select || select.matches(':disabled') || !option || option.disabled) return
    select.value = option.value
    select.dispatchEvent(new Event('input', { bubbles: true }))
    select.dispatchEvent(new Event('change', { bubbles: true }))
    close()
  }

  useLayoutEffect(() => {
    if (open) popup.current?.showPopover()
  }, [open, container])

  useEffect(() => {
    if (!open) return
    popup.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [active, open])
  useEffect(() => {
    const dismiss = () => {
      popup.current?.hidePopover?.()
      setOpen(false)
    }
    window.addEventListener('resize', dismiss)
    window.addEventListener('scroll', dismiss)
    return () => {
      window.removeEventListener('resize', dismiss)
      window.removeEventListener('scroll', dismiss)
    }
  }, [])

  return (
    <div className={cn('relative min-w-0', className)}>
      {leadingIcon && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 z-10 flex size-4 -translate-y-1/2 items-center justify-center text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0"
        >
          {leadingIcon}
        </span>
      )}
      <select
        {...props}
        ref={(node) => {
          field.current = node
          if (typeof ref === 'function') return ref(node)
          if (ref) ref.current = node
        }}
        data-slot="select-trigger"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
        className={cn(
          fieldControlClass,
          'ui-select min-h-10 appearance-none truncate py-2 pr-9 text-left leading-normal whitespace-nowrap max-sm:min-h-11 max-sm:py-3',
          leadingIcon && 'pl-9',
        )}
        onPointerDown={(event) => {
          props.onPointerDown?.(event)
          if (event.defaultPrevented || event.button > 0) return
          if (
            typeof HTMLElement.prototype.showPopover === 'function' &&
            !props.multiple &&
            (props.size ?? 1) === 1
          ) {
            event.preventDefault()
            field.current?.focus({ preventScroll: true })
          }
        }}
        onClick={(event) => {
          props.onClick?.(event)
          if (
            event.defaultPrevented ||
            props.multiple ||
            (props.size ?? 1) > 1 ||
            typeof HTMLElement.prototype.showPopover !== 'function'
          )
            return
          event.preventDefault()
          if (open) close()
          else show()
        }}
        onMouseDown={(event) => {
          props.onMouseDown?.(event)
          if (
            typeof HTMLElement.prototype.showPopover === 'function' &&
            !props.multiple &&
            (props.size ?? 1) === 1
          )
            event.preventDefault()
        }}
        onBlur={(event) => {
          props.onBlur?.(event)
          close()
        }}
        onKeyDown={(event) => {
          props.onKeyDown?.(event)
          if (
            event.defaultPrevented ||
            props.multiple ||
            (props.size ?? 1) > 1 ||
            typeof HTMLElement.prototype.showPopover !== 'function'
          )
            return
          const enabled = choices.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0)
          if (event.key === 'Escape' && open) {
            event.preventDefault()
            event.stopPropagation()
            close()
            return
          }
          if (event.key === 'Tab') {
            close()
            return
          }
          if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
            event.preventDefault()
            if (!open) {
              show()
              return
            }
            if (event.key === 'Enter' || event.key === ' ') {
              choose(active)
              return
            }
            const position = enabled.indexOf(active)
            setActive(
              event.key === 'Home'
                ? (enabled[0] ?? -1)
                : event.key === 'End'
                  ? (enabled.at(-1) ?? -1)
                  : (enabled[
                      (position + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) %
                        enabled.length
                    ] ?? -1),
            )
          } else if (
            open &&
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            event.preventDefault()
            const now = Date.now()
            typed.current = {
              value: (now - typed.current.at < 700 ? typed.current.value : '') + event.key,
              at: now,
            }
            const fold = (text: string) =>
              text
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/gi, 'd')
                .toLocaleLowerCase()
            const index = enabled.find((i) =>
              fold(field.current?.options[i]?.textContent ?? '').startsWith(
                fold(typed.current.value),
              ),
            )
            if (index !== undefined) setActive(index)
          }
        }}
      >
        {choices.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            aria-hidden={open || undefined}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      {container &&
        createPortal(
          <div
            ref={popup}
            style={position}
            id={id}
            popover="auto"
            role="listbox"
            aria-label={label || undefined}
            aria-hidden={!open}
            className="select-popover"
            onToggle={(event) => setOpen(event.newState === 'open')}
          >
            {open &&
              choices.map((option, index) => (
                <button
                  key={option.value}
                  id={`${id}-${index}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  disabled={option.disabled || props.disabled}
                  aria-selected={String(props.value ?? selected) === option.value}
                  data-active={active === index || undefined}
                  onPointerDown={(event) => event.preventDefault()}
                  onPointerMove={() => {
                    if (!option.disabled) setActive(index)
                  }}
                  onClick={() => choose(index)}
                >
                  <span>{option.label}</span>
                  <Check aria-hidden />
                </button>
              ))}
          </div>,
          container,
        )}
    </div>
  )
}
