// W1 (D-23-C): measure the ACTUAL field boundary tokens vs glass composites, both themes.
function parse(str) {
  let m = str.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.-]+)\s*(?:\/\s*([\d.]+)\s*)?\)/)
  if (m) {
    const L = parseFloat(m[1]), C = parseFloat(m[2]), hDeg = parseFloat(m[3]) * Math.PI / 180
    const alpha = m[4] ? parseFloat(m[4]) : 1
    const a_ = C * Math.cos(hDeg), b_ = C * Math.sin(hDeg)
    const l_ = L + 0.3963377774*a_ + 0.2158037573*b_, m_ = L - 0.1055613458*a_ - 0.0638541728*b_, s_ = L - 0.0894841775*a_ - 1.2914855480*b_
    const l3 = l_**3, m3 = m_**3, s3 = s_**3
    const gam = v => v <= 0.0031308 ? 12.92*v : 1.055*Math.pow(Math.max(v,0),1/2.4)-0.055
    return { r: gam(4.0767416621*l3 - 3.3077115913*m3 + 0.2309699292*s3), g: gam(-1.2684380046*l3 + 2.6097574011*m3 - 0.3413193965*s3), b: gam(-0.0041960863*l3 - 0.7034186147*m3 + 1.7076147010*s3), a: alpha }
  }
  m = str.match(/^#([0-9a-f]{6})$/i)
  if (m) return { r: parseInt(m[1].slice(0,2),16)/255, g: parseInt(m[1].slice(2,4),16)/255, b: parseInt(m[1].slice(4,6),16)/255, a: 1 }
  m = str.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/)
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 }
  return null
}
const over = (fgStr, bgStr) => { const f = parse(fgStr), b = parse(bgStr); const mix = k => f.a*f[k] + (1-f.a)*b[k]; return { r: mix('r'), g: mix('g'), b: mix('b') } }
const asStr = c => `rgba(${c.r},${c.g},${c.b},1)`
const lum = c => { const f = v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b) }
const ratio = (x, y) => { const a = lum(x), b = lum(y); return +(((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)).toFixed(3)) }

const light = { bg:'#fafbfc', panel:'oklch(0.974 0.005 265 / 0.8)', popover:'oklch(0.995 0.003 265 / 0.97)', input:'#7b8190', fieldRim:'oklch(1 0 0 / 0.9)' }
const dark = { bg:'oklch(0.16 0.005 285.8)', panel:'oklch(0.24 0.006 286 / 0.62)', popover:'oklch(0.23 0.006 286 / 0.97)', input:'oklch(0.66 0.015 286)', fieldRim:'oklch(1 0 0 / 0.08)' }

for (const [name, t] of [['light', light], ['dark', dark]]) {
  const panelComp = over(t.panel, t.bg)
  const popoverComp = over(t.popover, t.bg)
  const pcS = asStr(panelComp), poS = asStr(popoverComp)
  console.log(`## ${name}`)
  console.log('  input-border vs panel-composite:', ratio(parse(t.input) ? over(t.input, pcS) : parse(t.input), panelComp))
  console.log('  input-border vs popover-composite:', ratio(over(t.input, poS), popoverComp))
  // combined boundary reading: the border is the outer indicator; report rim separately
  console.log('  (panel-comp lum', lum(panelComp).toFixed(4), '| popover-comp lum', lum(popoverComp).toFixed(4) + ')')
}
