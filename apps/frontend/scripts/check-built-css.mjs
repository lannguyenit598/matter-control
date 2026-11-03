import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.argv[2] ?? '.next'
const files = readdirSync(join(root, 'static'), { recursive: true }).filter((file) =>
  file.endsWith('.css'),
)
assert.ok(files.length, 'Build must emit CSS assets')
const css = files.map((file) => readFileSync(join(root, 'static', file), 'utf8')).join('\n')
assert.doesNotMatch(
  css,
  /@(theme|apply|tailwind|custom-variant)\b/,
  'Tailwind CSS was not compiled',
)
for (const utility of ['flex', 'sr-only', 'bg-background']) {
  assert.match(css, new RegExp(`\\.${utility}\\s*\\{`), `Missing ${utility} utility in built CSS`)
}
console.log(
  `Compiled CSS verified: ${files.length} assets, layout/accessibility/theme utilities present`,
)
