import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const [root = 'src', flag] = process.argv.slice(2);
const WRITE = flag === '--write';

// Skip deps, build output, and the marketing folder (it uses its own mk-* tokens).
// [\\/] matches both Windows (\) and Unix (/) path separators.
const SKIP = /node_modules|\.next|[\\/]marketing[\\/]/i;

const NEUTRAL = new Set(['slate', 'gray', 'zinc', 'neutral', 'stone']);

const SEMANTIC = {
  indigo: 'primary', blue: 'primary', violet: 'primary',
  red: 'error', rose: 'error',
  green: 'success', emerald: 'success',
  amber: 'warning', yellow: 'warning', orange: 'warning',
  sky: 'info', cyan: 'info',
};

const N_BG = { 50: 'base-200', 100: 'base-200', 200: 'base-300', 300: 'base-300' };
const N_LINE = { 100: 'base-200', 200: 'base-300', 300: 'base-300' };
const N_TEXT = {
  900: 'base-content', 800: 'base-content', 700: 'base-content/80', 600: 'base-content/70',
  500: 'base-content/60', 400: 'base-content/50', 300: 'base-content/40',
};

function token(kind, fam, shade) {
  const s = Number(shade);
  const isLine = /^(border|ring|divide|outline)/.test(kind);
  const isBg = kind === 'bg';

  if (NEUTRAL.has(fam)) {
    if (isBg) return N_BG[s];
    if (isLine) return N_LINE[s];
    if (kind === 'text') return N_TEXT[s];
    return undefined;
  }

  const name = SEMANTIC[fam];
  if (!name) return undefined;

  if (isBg) {
    if (s >= 500) return name;
    if (s <= 100) return `${name}/10`;
    if (s === 200) return `${name}/20`;
    return undefined;
  }
  if (isLine) return s >= 400 ? name : `${name}/30`;
  if (kind === 'text') return s >= 500 ? name : undefined;
  return undefined;
}

const COLOR =
  /(?<![\w-])((?:[\w-]+:)*)(bg|text|border(?:-[trblxy])?|ring|divide|outline)-([a-z]+)-(\d{2,3})(\/\d+)?(?![\w-])/g;
const WHITE = /(?<![\w-])((?:[\w-]+:)*)bg-white(\/\d+)?(?![\w-])/g;

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (SKIP.test(p)) continue;
    if (statSync(p).isDirectory()) {
      walk(p, out);
    } else if (/\.(tsx|jsx|ts|js)$/.test(extname(p))) {
      out.push(p);
    }
  }
  return out;
}

let changed = 0;
let skipped = 0;

for (const file of walk(root)) {
  const src = readFileSync(file, 'utf8');

  let out = src
    .replace(COLOR, (m, pre, kind, fam, shade, op = '') => {
      if (pre.includes('dark:')) { skipped++; return m; }
      const t = token(kind, fam, shade);
      if (!t || (t.includes('/') && op)) { skipped++; return m; }
      return `${pre}${kind}-${t}${op}`;
    })
    .replace(WHITE, (m, pre, op = '') =>
      pre.includes('dark:') ? m : `${pre}bg-base-100${op}`
    );

  // text-white on a solid semantic bg -> that color's matching "-content" class
  out = out
    .split('\n')
    .map((line) => {
      const m = line.match(/(?<![\w-:])bg-(primary|error|success|warning|info)(?![\w/-])/);
      return m
        ? line.replace(/(?<![\w-])text-white(?![\w-])/g, `text-${m[1]}-content`)
        : line;
    })
    .join('\n');

  if (out !== src) {
    changed++;
    console.log(`${WRITE ? 'wrote' : 'would change'}: ${file}`);
    if (WRITE) writeFileSync(file, out);
  }
}

console.log(
  `\n${changed} files ${WRITE ? 'changed' : 'would change'}, ${skipped} classes left for manual review`
);