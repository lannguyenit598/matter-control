import { LocalizedInstant } from '@/components/molecules/localized-instant'

import { LocalizedText } from '@/components/molecules/localized-text'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Badge } from '@/components/atoms/badge'
import { ReadFailure } from '@/components/organisms/read-failure'
import { getSession } from '@/lib/auth'
import { attempt } from '@/lib/mc/errors'

import { matterRepository } from '../repository'

/** Scope labels come only from the authorized Matter read; each command still checks rights. */
export async function MatterScope({
  matterId,
  children,
}: {
  matterId: string
  children: ReactNode
}) {
  const here = `/matters/${encodeURIComponent(matterId)}`
  if (!(await getSession())) return <ReadFailure kind="sign-in" retryHref={here} />
  const read = await attempt(() => matterRepository.get(matterId))
  if (!read.ok) return <ReadFailure kind={read.kind} retryHref={here} subject="matter" />
  const { matter, asOf } = read.value
  return (
    <div className="flex flex-col gap-5">
      <nav
        aria-label="Current matter scope"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm"
      >
        <Link
          className="control-target underline"
          href={`/workspaces/${encodeURIComponent(matter.workspaceId)}`}
        >
          <LocalizedText en="Workspace" vi="Không gian làm việc" />{' '}
          <span className="font-mono text-xs">{matter.workspaceId}</span>
        </Link>
        <span aria-hidden="true">/</span>
        <Link className="control-target font-medium break-words underline" href={here}>
          {matter.title}
        </Link>
        <Badge variant="outline">{matter.callerRole}</Badge>
        {asOf && (
          <span className="text-xs text-muted-foreground">
            <LocalizedText en="Scope read at" vi="Phạm vi được đọc lúc" />{' '}
            <LocalizedInstant iso={asOf} />
          </span>
        )}
      </nav>
      {children}
    </div>
  )
}
