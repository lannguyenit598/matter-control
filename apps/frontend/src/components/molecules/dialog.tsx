'use client'

import { X } from 'lucide-react'
import { useEffect, useId, useReducer, useRef, type ReactNode } from 'react'

import { Button } from '@/components/atoms/button'
import { GlassSurface, useGlassTier } from '@/components/molecules/glass-surface'
import { cn } from '@/lib/utils'

export type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
  /**
   * Keep children mounted while closed (the closed <dialog> is hidden and inert). Use it for a
   * form whose unresolved state, e.g. an unknown command outcome, must survive close and reopen.
   */
  keepMounted?: boolean
}

/**
 * Modal dialog built on the native <dialog> element + showModal(): the browser provides
 * the focus trap, inert background, Escape-to-close, top-layer rendering and focus return.
 * Children mount only while open, so forms inside start fresh every time (unless `keepMounted`).
 * To choose the initially focused element, mark it with `data-autofocus`
 * (React's autoFocus runs before showModal() and would be overridden).
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  keepMounted,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const pressedOnBackdrop = useRef(false)
  const tier = useGlassTier()
  // Bumped on every native close so the effect re-syncs when the caller vetoed it (kept `open`).
  const [closeCount, onNativeClose] = useReducer((count: number) => count + 1, 0)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open, closeCount])

  return (
    <dialog
      ref={ref}
      data-slot="dialog-panel"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Route Escape through state so callers can veto closing (e.g. while a request is pending).
      onCancel={(event) => {
        event.preventDefault()
        onOpenChange(false)
      }}
      // Closed some other way, e.g. Chromium makes a repeated Escape non-cancelable and closes the
      // element itself. If the caller vetoes (keeps `open`), the effect reopens it; children stay
      // mounted, so a form being submitted keeps its draft and can still show its error.
      onClose={() => {
        onNativeClose()
        onOpenChange(false)
      }}
      // A click whose target is the <dialog> itself landed on the backdrop (content fills the box).
      // The press must start there too: selecting text and releasing outside also targets the
      // <dialog>, and closing then would throw away what the user typed.
      onPointerDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (pressedOnBackdrop.current && event.target === event.currentTarget) onOpenChange(false)
        pressedOnBackdrop.current = false
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border bg-card p-0 text-card-foreground shadow-lg',
        // Liquid tier: the GlassSurface layers supply the material (tint, rim, refraction), so
        // the host pane must not paint its own.
        tier === 'liquid' && 'glass-host',
        // Viewport-bounded: the content scrolls inside, the page behind never does (see below).
        className,
      )}
    >
      {(open || keepMounted) && (
        <GlassSurface
          className="max-h-[calc(100dvh-2rem)] rounded-lg"
          frost={0.35}
          refraction={24}
          bezel={28}
          blur={10}
          radius={8}
          pointerLight
        >
          <div className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-y-auto overscroll-contain p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1 [overflow-wrap:anywhere]">
                <h2 id={titleId} className="text-base leading-snug font-semibold">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                className="-mt-2 -mr-2 size-8"
                onClick={() => onOpenChange(false)}
              >
                <X aria-hidden />
              </Button>
            </div>
            {children}
          </div>
        </GlassSurface>
      )}
    </dialog>
  )
}
