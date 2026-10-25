// Evidence summarizer: prints one line per stage1 envelope (requestId, mode, outcome, status).
// Read-only over driver state; used to build 05-stage1-envelope-summary.txt.
const fs = require('fs')
const base = '/tmp/mc002-inta-state-intamvnmoems3pd/envelopes/intamvnmoems3pd'
const cases = ['T1', 'T2', 'W1', 'W2', 'T3', 'T4', 'T5', 'T8', 'W3', 'T6-W', 'T7-W']
for (const c of cases) {
  const arr = JSON.parse(fs.readFileSync(`${base}/${c}.json`, 'utf-8'))
  arr.forEach((e, i) => {
    const outcome = e.outcome === 'apiError'
      ? `apiError ${e.apiError.status}/${e.apiError.code}`
      : e.outcome
    const wire = e.wire ? ` wire=${e.wire.status}` : ''
    const body = e.outcome === 'value' && e.value ? ` id=${e.value.id} v=${e.value.version}` : ''
    console.log([
      `${c}[${i}]`,
      e.requestId,
      e.mode,
      `${e.method} ${e.routeTemplate}`,
      outcome,
      wire + body,
      `${e.latencyMs}ms`,
      e.startedAtUTC,
      e.truncated ? 'TRUNCATED' : 'cap16KiB-ok',
      `next=${e.nextVersion}`,
      `rev=${(e.harnessRevision || '').slice(0, 12)}`,
    ].join(' | '))
  })
}
