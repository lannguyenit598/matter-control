import type { ReviewCell, ReviewGridView } from './schemas'

/** What a cell shows. STALE (the question changed after the answer) wins for display only. */
export type CellLabel = 'PENDING' | 'REVIEWED' | 'ABSENT' | 'UNABLE' | 'STALE'
export const CELL_LABELS: readonly CellLabel[] = [
  'PENDING',
  'REVIEWED',
  'ABSENT',
  'UNABLE',
  'STALE',
]

export function cellLabel(c: ReviewCell): CellLabel {
  return c.stale ? 'STALE' : c.state
}

export type MatrixFilter = { state?: CellLabel; q?: string }

const MAX_TEXT = 100
const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined)

/** Untrusted URL state: an unknown state is "no filter" and the text is cut to a safe length. */
export function parseMatrixFilter(
  raw: Record<string, string | string[] | undefined>,
): MatrixFilter {
  const state = CELL_LABELS.find((s) => s === one(raw.state))
  const q = one(raw.q)?.trim().slice(0, MAX_TEXT)
  return { ...(state ? { state } : {}), ...(q ? { q } : {}) }
}

const ID = /^[A-Za-z0-9_-]{1,100}$/

/** `cell=<versionId>:<questionId>`; anything else is no selection. */
export function parseCell(
  raw: string | undefined,
): { versionId: string; questionId: string } | null {
  const parts = raw?.split(':') ?? []
  const [versionId, questionId] = parts
  if (
    parts.length !== 2 ||
    !versionId ||
    !questionId ||
    !ID.test(versionId) ||
    !ID.test(questionId)
  )
    return null
  return { versionId, questionId }
}

/** Cells matching the filter: by label and/or by text in the answer, its references, the question or the document. */
export function filterCells(view: ReviewGridView, f: MatrixFilter): ReviewCell[] {
  const needle = f.q?.toLowerCase()
  const question = new Map(view.questions.map((q) => [q.id, q.text.toLowerCase()]))
  const version = new Map(
    view.versions.map((v) => [v.versionId, `${v.documentName} ${v.filename}`.toLowerCase()]),
  )
  return view.cells.filter((c) => {
    if (f.state && cellLabel(c) !== f.state) return false
    if (!needle) return true
    const hay = [
      c.answer?.text,
      c.answer?.pageRef,
      c.answer?.quoteRef,
      question.get(c.questionId),
      version.get(c.versionId),
    ]
      .filter(Boolean)
      .join('\n')
      .toLowerCase()
    return hay.includes(needle)
  })
}

/** Rows (versions) that have at least one matching cell, in grid order; everything when unfiltered. */
export function visibleVersionIds(view: ReviewGridView, f: MatrixFilter): string[] {
  if (!f.state && !f.q) return view.versions.map((v) => v.versionId)
  const hit = new Set(filterCells(view, f).map((c) => c.versionId))
  return view.versions.map((v) => v.versionId).filter((id) => hit.has(id))
}
