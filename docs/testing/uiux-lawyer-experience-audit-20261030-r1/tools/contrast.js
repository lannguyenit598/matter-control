// WCAG 2.x contrast computation over browser-resolved MatterControl tokens.
// Input: ../tokens-computed.json (produced live via getComputedStyle probes on 127.0.0.1:3100).
// Method: parse computed color strings, composite alpha over a base, WCAG relative luminance ratio.
// Limitation: glass tokens composited over --background approximate the real gradient wash;
// this is the same encoding-sRGB assumption recorded in docs/design/liquid-form-legibility-20261030.
const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tokens-computed.json'), 'utf8'));

function parseColor(s) {
  if (!s || s === 'transparent' || s === 'none') return null;
  let m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    // rgb(1, 2, 3) or rgb(1 2 3 / 0.5)
    const nums = m[1].split('/').map(x => x.trim());
    const rgb = nums[0].split(/[\s,]+/).map(Number);
    const a = nums[1] !== undefined ? parseFloat(nums[1]) : 1;
    return { r: rgb[0], g: rgb[1], b: rgb[2], a };
  }
  m = s.match(/color\(\s*srgb\s+([^)]+)\)/);
  if (m) {
    const parts = m[1].split(/[\s,\/]+/).filter(Boolean);
    const rgb = [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])].map(v => v * 255);
    const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
    return { r: rgb[0], g: rgb[1], b: rgb[2], a };
  }
  if (s.startsWith('oklch(') || s.startsWith('oklab(')) {
    const inner = s.slice(s.indexOf('(') + 1, s.lastIndexOf(')'));
    const seg = inner.split('/');
    const nums = seg[0].trim().split(/[\s,]+/).map(Number);
    const a = seg[1] !== undefined ? parseFloat(seg[1]) : 1;
    if (s.startsWith('oklab(')) {
      const [L, aa, bb] = nums;
      const rgb = oklabToSrgb(L, aa, bb);
      return { r: rgb[0], g: rgb[1], b: rgb[2], a };
    }
    const [L, C, H] = nums;
    const rad = (H * Math.PI) / 180;
    const rgb = oklabToSrgb(L, C * Math.cos(rad), C * Math.sin(rad));
    return { r: rgb[0], g: rgb[1], b: rgb[2], a };
  }
  return { raw: s, a: 1 };
}
function oklabToSrgb(L, A, B) {
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = L - 0.0894841775 * A - 1.2914855480 * B;
  const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  const lin = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
  return lin.map((c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(1, v)) * 255;
  });
}
function toLinear(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function luminance({ r, g, b }) { return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b); }
function ratio(fg, bg) {
  const l1 = luminance(fg), l2 = luminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
function composite(fg, bg) {
  if (fg.a >= 1) return fg;
  return { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 };
}
function get(map, name) { const v = map[name]; return v ? parseColor(v) : null; }

const PAIRS = [
  ['foreground', 'background', 4.5, 'body text'],
  ['muted-foreground', 'background', 4.5, 'secondary text on page'],
  ['muted-foreground', 'card', 4.5, 'secondary text on card'],
  ['primary-foreground', 'primary', 4.5, 'primary button label'],
  ['secondary-foreground', 'secondary', 4.5, 'secondary control label'],
  ['accent-foreground', 'accent', 4.5, 'accent control label'],
  ['destructive-foreground', 'destructive', 4.5, 'destructive control label'],
  ['success-foreground', 'success', 4.5, 'success control label (if used)'],
  ['warning-foreground', 'warning', 4.5, 'warning control label (if used)'],
  ['header-foreground', 'header', 4.5, 'header text'],
  ['foreground', 'panel', 4.5, 'text on glass panel (composite)'],
  ['muted-foreground', 'panel', 4.5, 'secondary text on glass panel (composite)'],
  ['ring', 'background', 3.0, 'focus ring vs page (non-text 3:1)'],
  ['border', 'background', 3.0, 'control border vs page (non-text 3:1)'],
  ['execution', 'card', 3.0, 'execution axis cue vs card (3:1 UI/text-large)'],
  ['verification', 'card', 3.0, 'verification axis cue vs card'],
  ['dependency-ready', 'card', 3.0, 'dependency-ready cue vs card'],
  ['dependency-blocked', 'card', 3.0, 'dependency-blocked cue vs card'],
  ['timing', 'card', 3.0, 'timing cue vs card'],
  ['attention', 'card', 3.0, 'attention cue vs card'],
];
// badge pattern: axis color text over axis/10 composite on card
const AXIS = ['execution', 'verification', 'dependency-ready', 'dependency-blocked', 'timing', 'attention'];

function run(theme) {
  const map = data[theme];
  const rows = [];
  for (const [fgName, bgName, threshold, label] of PAIRS) {
    let fg = get(map, '--' + fgName);
    let bg = get(map, '--' + bgName);
    if (!fg || !bg) { rows.push({ theme, pair: fgName + ' on ' + bgName, label, result: 'N/A (token missing)', raw: { fg: map['--' + fgName], bg: map['--' + bgName] } }); continue; }
    if (fg.raw || bg.raw) { rows.push({ theme, pair: fgName + ' on ' + bgName, label, result: 'UNPARSED', raw: { fg: map['--' + fgName], bg: map['--' + bgName] } }); continue; }
    const bgBase = bg.a < 1 ? composite(bg, get(map, '--background')) : bg;
    const fgC = fg.a < 1 ? composite(fg, bgBase) : fg;
    const r = ratio(fgC, bgBase);
    rows.push({ theme, pair: fgName + ' on ' + bgName, label, ratio: Math.round(r * 1000) / 1000, threshold, result: r >= threshold ? 'PASS' : 'FAIL' });
  }
  const card = get(map, '--card') && get(map, '--card').a < 1 ? composite(get(map, '--card'), get(map, '--background')) : get(map, '--card');
  for (const axis of AXIS) {
    const c = get(map, '--' + axis);
    if (!c || c.raw) { rows.push({ theme, pair: axis + ' cue', result: 'N/A/UNPARSED' }); continue; }
    const r = card ? ratio(c, card) : null;
    rows.push({ theme, pair: axis + ' (direct) vs card', ratio: r && Math.round(r * 1000) / 1000, threshold: 3.0, result: r ? (r >= 3 ? 'PASS' : 'FAIL') : 'N/A' });
  }
  return rows;
}

const out = { generatedAt: new Date().toISOString(), method: 'browser-computed token colors (127.0.0.1:3100 getComputedStyle probe), WCAG 2.x relative luminance; alpha composited over background/card; glass over --background', light: run('light'), dark: run('dark') };
fs.writeFileSync(path.join(__dirname, '..', 'contrast-results.json'), JSON.stringify(out, null, 2));

// markdown
const fmt = (rows) => {
  let md = '| Pair | Use | Ratio | Threshold | Result |\n|---|---|---|---|---|\n';
  for (const r of rows) md += `| ${r.pair} | ${r.label || ''} | ${r.ratio ?? ''} | ${r.threshold ?? ''} | ${r.result} |\n`;
  return md;
};
let md = '# Measured contrast (WCAG 2.x) — MatterControl tokens\n\n';
md += '- Colors resolved by the browser itself (getComputedStyle probes on the live 127.0.0.1:3100 app, both themes).\n';
md += '- Alpha colors composited over --background (or --card where stated). Glass panels approximated over --background; the real backdrop is a fixed pastel gradient — see limitations.\n';
md += '- Text threshold 4.5:1; non-text (borders, focus ring, axis cues) 3:1.\n\n';
md += '## Light\n\n' + fmt(out.light) + '\n## Dark\n\n' + fmt(out.dark);
fs.writeFileSync(path.join(__dirname, '..', 'contrast-results.md'), md);
const fails = [...out.light, ...out.dark].filter(r => r.result === 'FAIL');
console.log('rows:', out.light.length + out.dark.length, 'FAILs:', fails.length);
for (const f of fails) console.log('FAIL', f.theme, f.pair, f.ratio, '(threshold', f.threshold + ')');
const unp = [...out.light, ...out.dark].filter(r => r.result === 'UNPARSED' || r.result.startsWith('N/A'));
for (const u of unp) console.log('SKIP', u.theme, u.pair, JSON.stringify(u.raw || {}));
