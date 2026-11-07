/**
 * UX-B-08 (W9) — deterministic off-4px-grid spacing scanner for the sloplint NOTE surfaces.
 * Scans the two cited CSS files for padding/margin/gap declarations with px values not on the
 * 4px grid and prints the raw inventory the normalisation pass works from. Read-only.
 *
 * Run: node docs/testing/mc-fe-fixwave2-20261107-r1/commands/off-grid-scan.mjs [<css file> ...]
 */
import { readFileSync } from 'node:fs'

const files = process.argv.slice(2)
const props = /(^|\{\s|\s)(padding|padding-(?:top|bottom|left|right|inline|block|inline-start|inline-end|block-start|block-end)|margin|margin-(?:top|bottom|left|right|inline|block|inline-start|inline-end|block-start|block-end)|gap|row-gap|column-gap)\s*:\s*([^;}]+)[;}]/g

let total = 0
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  console.log(`## ${file}`)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    props.lastIndex = 0
    let m
    while ((m = props.exec(line))) {
      // every px length in the declaration value (ignores 0, rem, % — rem/% are token-scaled units)
      const px = [...m[3].matchAll(/([\d.]+)px/g)].map((x) => parseFloat(x[1]))
      const off = px.filter((v) => v % 4 !== 0)
      if (off.length === 0) continue
      total++
      console.log(`${String(i + 1).padStart(4)}: ${line.trim()}   [off: ${off.map(String).join(',')}]`)
    }
  }
}
console.log(`total off-grid spacing declarations: ${total}`)
