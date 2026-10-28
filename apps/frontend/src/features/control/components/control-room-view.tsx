import { LocalizedInstant } from '@/components/molecules/localized-instant'

import { LocalizedText } from '@/components/molecules/localized-text'
import Link from 'next/link'

import { GAP_LABEL, GATE_LABEL, GATE_REASON, KIND_LABEL, userName } from '../labels'
import type { ContextRecord, ControlRoom } from '../schemas'

export type RoomLabels = {
  users: Record<string, string>
  parties: Record<string, string>
  titles: Record<string, string>
}

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string
  title: React.ReactNode
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="rounded-md border p-4">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {hint && <p className="mb-2 text-sm text-muted-foreground">{hint}</p>}
      {children}
    </section>
  )
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
)

function Stat({
  label,
  value,
  emphasis,
}: {
  label: React.ReactNode
  value: number
  emphasis?: boolean
}) {
  return (
    <div className={`rounded-md border p-3 ${emphasis && value > 0 ? 'border-primary' : ''}`}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
    </div>
  )
}

function Decisions({ items, matterId }: { items: ContextRecord[]; matterId: string }) {
  if (items.length === 0) return null
  return (
    <ul className="mt-1 list-disc pl-5 text-sm">
      {items.map((d) => (
        <li key={d.id}>
          <span className="font-medium">Decision:</span> {d.title}{' '}
          <Link href={`/matters/${matterId}/control-room#records`} className="underline">
            open
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * The manager's one-screen reading of a matter, in the order a manager triages: what is blocked and
 * why, what to do next (with its owner and the decisions that concern it), what is waiting, milestones,
 * gaps, then what changed. Every row links to the record it describes. The boundary is shown, and a
 * section that could not be built is an error page, never an empty list.
 */
export function ControlRoomView({
  matterId,
  room,
  labels,
}: {
  matterId: string
  room: ControlRoom
  labels: RoomLabels
}) {
  const t = (id: string) => labels.titles[id] ?? `record ${id.slice(0, 8)}`
  const rec = (id: string) =>
    `/matters/${matterId}/work/${id}?from=${encodeURIComponent(`/matters/${matterId}/control-room`)}`
  const s = room.state
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        <LocalizedText en="As of" vi="Tại thời điểm" /> <LocalizedInstant iso={room.asOf} /> ·
        source revision {room.sourceRevision}. Every figure below is read from the same snapshot of
        the underlying records.
      </p>

      <dl aria-label="State" className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <Stat label={<LocalizedText en="Records" vi="Bản ghi" />} value={s.total} />
        <Stat label={<LocalizedText en="Blocked" vi="Bị chặn" />} value={s.blocked} emphasis />
        <Stat label={<LocalizedText en="Overdue" vi="Quá hạn" />} value={s.overdue} emphasis />
        <Stat
          label={<LocalizedText en="Critical" vi="Nghiêm trọng" />}
          value={s.critical}
          emphasis
        />
        <Stat
          label={<LocalizedText en="Waiting" vi="Đang chờ" />}
          value={s.byExecution.WAITING ?? 0}
        />
        <Stat
          label={<LocalizedText en="Awaiting proof" vi="Chờ bằng chứng" />}
          value={s.awaitingProof}
          emphasis
        />
        <Stat
          label={<LocalizedText en="Open filings" vi="Thủ tục đang mở" />}
          value={s.openFilings}
        />
        <Stat
          label={<LocalizedText en="Rejected filings" vi="Thủ tục bị từ chối" />}
          value={s.negativeFilings}
          emphasis
        />
      </dl>

      <Section
        id="blockers"
        title={<LocalizedText en="Blocked" vi="Bị chặn" />}
        hint={
          <LocalizedText
            en="Why each record cannot proceed, and what holds it."
            vi="Vì sao từng bản ghi chưa thể tiếp tục và điều gì đang cản trở."
          />
        }
      >
        {room.blockers.length === 0 ? (
          <Empty>
            <LocalizedText en="Nothing is blocked." vi="Không có công việc bị chặn." />
          </Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {room.blockers.map((b) => (
              <li key={b.item.id} className="text-sm">
                <Link href={rec(b.item.id)} className="font-medium underline">
                  {b.item.title}
                </Link>{' '}
                · owner {userName(labels.users, b.item.ownerId)}
                <ul className="list-disc pl-5">
                  {b.reasons.map((r) => {
                    const u = b.upstream.find((x) => x.id === r.sourceId)
                    return (
                      <li key={r.edgeId}>
                        {GATE_LABEL[r.gate] ?? r.gate} on{' '}
                        <Link href={rec(r.sourceId)} className="underline">
                          {u?.title ?? t(r.sourceId)}
                        </Link>
                        {u && (
                          <>
                            {' '}
                            ({u.execution.toLowerCase().replaceAll('_', ' ')}
                            {u.verification
                              ? `, ${u.verification.toLowerCase().replaceAll('_', ' ')}`
                              : ''}
                            )
                          </>
                        )}
                        : {GATE_REASON[r.code] ?? r.code.toLowerCase().replaceAll('_', ' ')}.
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        id="next"
        title={<LocalizedText en="Do next" vi="Việc tiếp theo" />}
        hint={
          <LocalizedText
            en="Ready work that releases a blocked record or sits on a critical chain."
            vi="Công việc sẵn sàng giúp gỡ chặn hoặc thuộc chuỗi công việc trọng yếu."
          />
        }
      >
        {room.nextActions.length === 0 ? (
          <Empty>
            <LocalizedText
              en="No ready work is holding anything up."
              vi="Không có công việc sẵn sàng đang cản trở tiến độ."
            />
          </Empty>
        ) : (
          <ol className="flex flex-col gap-3">
            {room.nextActions.map((n) => (
              <li key={n.item.id} className="text-sm">
                <Link href={rec(n.item.id)} className="font-medium underline">
                  {n.item.title}
                </Link>{' '}
                · owner {userName(labels.users, n.item.ownerId)}
                {n.item.dueAt ? ` · due ${n.item.dueAt}` : ''}
                {n.derived.attention !== 'NORMAL' ? ` · ${n.derived.attention.toLowerCase()}` : ''}
                {n.unblocks.length > 0 && (
                  <p>
                    <LocalizedText en="Releases:" vi="Gỡ chặn:" /> {n.unblocks.map(t).join(', ')}
                  </p>
                )}
                <Decisions items={n.decisions} matterId={matterId} />
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section
        id="waiting"
        title={<LocalizedText en="Waiting on" vi="Đang chờ" />}
        hint={
          <LocalizedText
            en="Waiting is not blocked: someone outside is expected to act."
            vi="Đang chờ khác với bị chặn: cần một bên ngoài thực hiện công việc."
          />
        }
      >
        {room.waiting.length === 0 ? (
          <Empty>
            <LocalizedText
              en="Nothing is waiting on an external party."
              vi="Không có công việc đang chờ bên ngoài."
            />
          </Empty>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {room.waiting.map((w) => (
              <li key={w.item.id}>
                <Link href={rec(w.item.id)} className="font-medium underline">
                  {w.item.title}
                </Link>
                :{' '}
                {w.item.waitingPartyId
                  ? (labels.parties[w.item.waitingPartyId] ?? 'an external party')
                  : 'an external party'}{' '}
                — {w.item.waitingCondition}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="milestones" title={<LocalizedText en="Milestones" vi="Cột mốc" />}>
        {room.milestones.length === 0 ? (
          <Empty>
            <LocalizedText en="No milestones are defined." vi="Chưa xác định cột mốc." />
          </Empty>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {room.milestones.map((m) => (
              <li key={m.milestone.id}>
                <span className="font-medium">{m.milestone.name}</span>:{' '}
                {m.status.state === 'UNASSESSED'
                  ? 'not assessed (no prerequisites declared)'
                  : `${m.status.state === 'READY' ? 'ready' : 'not ready'} — ${m.status.satisfied} of ${m.status.total} prerequisites satisfied`}
                {m.milestone.critical && ' · critical'}
                {m.status.unsatisfied.length > 0 && (
                  <ul className="list-disc pl-5">
                    {m.status.unsatisfied.map((u) => (
                      <li key={u.itemId}>
                        <Link href={rec(u.itemId)} className="underline">
                          {t(u.itemId)}
                        </Link>
                        : {u.reasons.map((r) => r.toLowerCase().replaceAll('_', ' ')).join(', ')}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        id="gaps"
        title={<LocalizedText en="Gaps" vi="Khoảng trống" />}
        hint={
          <LocalizedText
            en="Missing proof, criteria or owners."
            vi="Thiếu bằng chứng, tiêu chí hoặc người phụ trách."
          />
        }
      >
        {room.gaps.length === 0 ? (
          <Empty>
            <LocalizedText en="No gaps found." vi="Không tìm thấy khoảng trống." />
          </Empty>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {room.gaps.map((g) => (
              <li key={`${g.itemId}:${g.kind}`}>
                <Link href={rec(g.itemId)} className="underline">
                  {t(g.itemId)}
                </Link>
                : {GAP_LABEL[g.kind] ?? g.kind}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        id="context"
        title={
          <LocalizedText
            en="Open decisions, risks and findings"
            vi="Quyết định, rủi ro và phát hiện đang mở"
          />
        }
      >
        {room.decisions.length + room.risks.length + room.findings.length === 0 ? (
          <Empty>
            <LocalizedText en="Nothing is recorded yet." vi="Chưa có bản ghi." />
          </Empty>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {[...room.decisions, ...room.risks, ...room.findings].map((r) => (
              <li key={r.id}>
                <span className="font-medium">{KIND_LABEL[r.kind]}:</span> {r.title}
                {r.links.length > 0 && (
                  <span className="text-muted-foreground">
                    {' '}
                    — concerns {r.links.map(t).join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        id="changes"
        title={<LocalizedText en="What changed" vi="Thay đổi gần đây" />}
        hint={<LocalizedText en="Most recent first." vi="Mới nhất trước." />}
      >
        {room.changes.length === 0 ? (
          <Empty>
            <LocalizedText en="No changes recorded." vi="Chưa ghi nhận thay đổi." />
          </Empty>
        ) : (
          <ol className="flex flex-col gap-1 text-sm">
            {room.changes.map((c) => (
              <li key={c.id}>
                <LocalizedInstant iso={c.recordedAt} /> · {c.type}
                {c.reason ? ` — ${c.reason}` : ''}
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  )
}
