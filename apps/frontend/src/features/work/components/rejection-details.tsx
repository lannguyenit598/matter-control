import type { McRejection } from '@/lib/mc/errors'

import { GATE_LABEL, GATE_REASON } from '../labels'

/**
 * The domain's own explanation of a refusal: which gate failed and why, the loop a dependency
 * would have closed, and what status changes would have been allowed. Titles are resolved from the
 * ids the screen already has; an unknown id shows as a short id, never as invented text.
 */
export function RejectionDetails({
  rejection,
  titles,
}: {
  rejection: McRejection
  titles: Record<string, string>
}) {
  const name = (id: string) => titles[id] ?? `record ${id.slice(0, 8)}`
  return (
    <div className="mt-2 flex flex-col gap-2 text-sm">
      {rejection.gates.length > 0 && (
        <div>
          <p className="font-medium">Not satisfied:</p>
          <ul className="list-disc pl-5">
            {rejection.gates.map((g) => (
              <li key={g.edgeId}>
                {GATE_LABEL[g.gate] ?? g.gate} on “{name(g.sourceId)}”:{' '}
                {GATE_REASON[g.code] ?? g.code}
              </li>
            ))}
          </ul>
        </div>
      )}
      {rejection.path.length > 1 && (
        <p>
          The loop would run:{' '}
          {rejection.path
            .map(name)
            .map((n) => `“${n}”`)
            .join(' → ')}{' '}
          → back to “{name(rejection.path[0]!)}”.
        </p>
      )}
      {rejection.alternatives.length > 0 && (
        <p>
          Allowed from here:{' '}
          {rejection.alternatives.map((a) => a.replace('_', ' ').toLowerCase()).join(', ')}.
        </p>
      )}
    </div>
  )
}
