'use client'

import { useState, type ReactNode } from 'react'

import { Button, type ButtonProps } from '@/components/atoms/button'
import { Dialog } from '@/components/molecules/dialog'

import { TaskSuccess } from './intent-form'

export type FormDialogProps = {
  /** Visible label of the single button that opens the dialog. */
  trigger: ReactNode
  triggerVariant?: ButtonProps['variant']
  title: ReactNode
  description?: ReactNode
  /**
   * Said next to the trigger after a form inside confirms success (the dialog closes then). Without
   * it the dialog still closes; the refreshed page is the only sign of what changed.
   */
  successNotice?: ReactNode
  /** Receives whether the dialog is open and a `close` to call after a confirmed success. */
  children: (ctx: { open: boolean; close: () => void }) => ReactNode
}

/**
 * One visible action that opens a focused form. The form stays mounted while the dialog is
 * closed, so an unresolved command (pending or unknown outcome) is still there on reopen and
 * closing is never a hidden cancel or resend. Focus returns to the trigger on close. An
 * `IntentForm` inside closes the dialog by itself after a confirmed success (`TaskSuccess`).
 */
export function FormDialog({
  trigger,
  triggerVariant,
  title,
  description,
  successNotice,
  children,
}: FormDialogProps) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState<ReactNode>(null)
  return (
    <>
      <Button
        variant={triggerVariant}
        aria-haspopup="dialog"
        onClick={() => {
          setDone(null)
          setOpen(true)
        }}
      >
        {trigger}
      </Button>
      {done && (
        <p role="status" className="text-sm text-muted-foreground">
          {done}
        </p>
      )}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        keepMounted
      >
        <TaskSuccess.Provider
          value={(notice) => {
            setDone(notice ?? successNotice ?? null)
            setOpen(false)
          }}
        >
          {children({ open, close: () => setOpen(false) })}
        </TaskSuccess.Provider>
      </Dialog>
    </>
  )
}

/**
 * `FormDialog` for server pages, which cannot pass the render function: the form is plain
 * children, mounted for as long as the page is.
 */
export function TaskDialog({
  children,
  ...rest
}: Omit<FormDialogProps, 'children'> & { children: ReactNode }) {
  return <FormDialog {...rest}>{() => children}</FormDialog>
}
