/**
 * Wall-clock entry in the device zone (BF-03). A person types the local time they mean; the wire
 * always carries an explicit instant. The offset comes from the zone rules at that date, so DST
 * and non-hour zones are right, a local time that does not exist is refused, and a time that
 * occurs twice is never guessed: the caller must be told to choose.
 */

const LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

const formatters = new Map<string, Intl.DateTimeFormat>()
function parts(zone: string): Intl.DateTimeFormat {
  let f = formatters.get(zone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    formatters.set(zone, f)
  }
  return f
}

/** The zone's wall-clock fields for an instant, as a UTC millisecond reading of those fields. */
function wallMs(ms: number, zone: string): number {
  const p = Object.fromEntries(
    parts(zone)
      .formatToParts(new Date(ms))
      .map((x) => [x.type, x.value]),
  )
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
}

/** Offset of the zone from UTC at an instant, in milliseconds. */
function offsetMs(ms: number, zone: string): number {
  return wallMs(ms - (ms % 1000), zone) - (ms - (ms % 1000))
}

const DAY = 24 * 60 * 60 * 1000
const iso = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z')

export type ResolvedLocal =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'nonexistent' }
  | { kind: 'ok'; iso: string }
  | { kind: 'ambiguous'; earlier: string; later: string }

/** Resolves a `datetime-local` value ("YYYY-MM-DDTHH:mm") in an IANA zone. */
export function resolveLocal(local: string, zone: string): ResolvedLocal {
  if (!local) return { kind: 'empty' }
  const m = LOCAL.exec(local)
  if (!m) return { kind: 'invalid' }
  const [y, mo, d, h, mi, s] = [+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] ?? 0)]
  const wall = Date.UTC(y, mo - 1, d, h, mi, s)
  const back = new Date(wall)
  if (
    back.getUTCFullYear() !== y ||
    back.getUTCMonth() !== mo - 1 ||
    back.getUTCDate() !== d ||
    back.getUTCHours() !== h ||
    back.getUTCMinutes() !== mi
  ) {
    return { kind: 'invalid' }
  }
  // Any real instant for this wall time uses one of the offsets in force a day either side.
  const valid = new Set<number>()
  for (const probe of [wall - DAY, wall + DAY]) {
    const o = offsetMs(probe, zone)
    if (offsetMs(wall - o, zone) === o) valid.add(wall - o)
  }
  const instants = [...valid].sort((a, b) => a - b)
  if (instants.length === 0) return { kind: 'nonexistent' }
  if (instants.length === 1) return { kind: 'ok', iso: iso(instants[0]) }
  return { kind: 'ambiguous', earlier: iso(instants[0]), later: iso(instants[1]) }
}

/** An instant as the zone's `datetime-local` value, or '' when it is not a valid instant. */
export function instantToLocal(instant: string, zone: string): string {
  const t = Date.parse(instant)
  if (Number.isNaN(t)) return ''
  return new Date(wallMs(t, zone)).toISOString().slice(0, 16)
}

/** "UTC+07:00": the zone's offset at that instant. */
export function offsetLabel(instant: string, zone: string): string {
  const t = Date.parse(instant)
  if (Number.isNaN(t)) return ''
  const o = offsetMs(t, zone) / 60000
  const sign = o < 0 ? '-' : '+'
  const abs = Math.abs(o)
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

export type LocalField = { ok: true; iso: string } | { ok: false; error: string }

/**
 * Reads one local-time field of a submitted form: `<name>Local` is the control and `<name>Choice`
 * ('earlier' | 'later') answers an ambiguous time. An untouched value keeps the exact original
 * instant (the control only shows minutes); a cleared value is the empty string.
 */
export function readLocalField(
  values: Record<string, string | undefined>,
  name: string,
  zone: string,
  original?: string | null,
): LocalField {
  const local = values[`${name}Local`] ?? ''
  if (original && local === instantToLocal(original, zone)) return { ok: true, iso: original }
  const r = resolveLocal(local, zone)
  switch (r.kind) {
    case 'empty':
      return { ok: true, iso: '' }
    case 'ok':
      return { ok: true, iso: r.iso }
    case 'invalid':
      return { ok: false, error: 'Enter a valid date and time.' }
    case 'nonexistent':
      return {
        ok: false,
        error: 'That local time does not exist in your time zone (clocks skip it). Pick another.',
      }
    case 'ambiguous': {
      const choice = values[`${name}Choice`]
      if (choice === 'earlier') return { ok: true, iso: r.earlier }
      if (choice === 'later') return { ok: true, iso: r.later }
      return {
        ok: false,
        error: 'That local time happens twice in your time zone. Choose the first or the second.',
      }
    }
  }
}
