/**
 * Writes the month, birthday, and holiday token blocks in lib/themes/tokens.css.
 *
 *   node scripts/emit-theme-tokens.mjs
 *
 * Each palette is a hue family plus an accent. Light and dark values are
 * derived so the two schemes stay in the same season. Placeholder art reads
 * these tokens; it is not a second palette.
 */
import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../lib/themes/tokens.css", import.meta.url);

/** @type {{ id: string, font: string, h: number, c: number, ah: number, ac: number, grain: number, vignette: number, radius: [number, number, number], surfaceL?: number, accentL?: number, shadow?: string }[]} */
const themes = [
  { id: "january", font: "--font-display-cormorant", h: 230, c: 0.012, ah: 222, ac: 0.045, grain: 0.05, vignette: 0.1, radius: [0.35, 0.65, 0.9] },
  { id: "february", font: "--font-display-libre", h: 15, c: 0.016, ah: 8, ac: 0.07, grain: 0.04, vignette: 0.07, radius: [0.5, 0.9, 1.3] },
  { id: "march", font: "--font-display-fraunces", h: 145, c: 0.02, ah: 150, ac: 0.07, grain: 0.04, vignette: 0.06, radius: [0.55, 0.95, 1.4] },
  { id: "april", font: "--font-display-lora", h: 350, c: 0.018, ah: 145, ac: 0.08, grain: 0.035, vignette: 0.05, radius: [0.6, 1, 1.5] },
  { id: "may", font: "--font-display-literata", h: 135, c: 0.022, ah: 140, ac: 0.09, grain: 0.03, vignette: 0.045, radius: [0.55, 0.95, 1.4] },
  { id: "june", font: "--font-display-source-serif", h: 85, c: 0.02, ah: 78, ac: 0.09, grain: 0.03, vignette: 0.04, radius: [0.5, 0.9, 1.35] },
  { id: "july", font: "--font-display-dm-serif", h: 210, c: 0.02, ah: 55, ac: 0.1, grain: 0.045, vignette: 0.08, radius: [0.4, 0.75, 1.1] },
  { id: "august", font: "--font-display-eb-garamond", h: 75, c: 0.024, ah: 68, ac: 0.1, grain: 0.055, vignette: 0.09, radius: [0.4, 0.75, 1.05] },
  { id: "september", font: "--font-display-spectral", h: 105, c: 0.02, ah: 95, ac: 0.08, grain: 0.04, vignette: 0.07, radius: [0.45, 0.8, 1.15] },
  { id: "october", font: "--font-display-bodoni", h: 55, c: 0.028, ah: 42, ac: 0.11, grain: 0.06, vignette: 0.12, radius: [0.35, 0.65, 0.95] },
  { id: "november", font: "--font-display-crimson", h: 50, c: 0.016, ah: 35, ac: 0.06, grain: 0.055, vignette: 0.14, radius: [0.35, 0.6, 0.9] },
  { id: "december", font: "--font-display-playfair", h: 160, c: 0.018, ah: 25, ac: 0.09, grain: 0.045, vignette: 0.11, radius: [0.4, 0.75, 1.1] },
  { id: "birthday", font: "--font-display-birthday", h: 70, c: 0.022, ah: 65, ac: 0.1, grain: 0.04, vignette: 0.06, radius: [0.6, 1.05, 1.55] },
  { id: "new-year", font: "--font-display-cormorant", h: 220, c: 0.014, ah: 85, ac: 0.06, grain: 0.04, vignette: 0.08, radius: [0.4, 0.75, 1.1] },
  { id: "valentines", font: "--font-display-libre", h: 12, c: 0.02, ah: 5, ac: 0.09, grain: 0.035, vignette: 0.06, radius: [0.6, 1, 1.5] },
  { id: "halloween", font: "--font-display-bodoni", h: 40, c: 0.03, ah: 55, ac: 0.14, grain: 0.07, vignette: 0.2, radius: [0.3, 0.5, 0.75], surfaceL: 93, accentL: 50 },
  { id: "christmas", font: "--font-display-playfair", h: 155, c: 0.02, ah: 25, ac: 0.1, grain: 0.04, vignette: 0.1, radius: [0.4, 0.75, 1.15] },
  { id: "new-years-eve", font: "--font-display-playfair", h: 250, c: 0.016, ah: 85, ac: 0.08, grain: 0.05, vignette: 0.16, radius: [0.35, 0.65, 1], surfaceL: 95 },
  { id: "holi", font: "--font-display-fraunces", h: 340, c: 0.02, ah: 330, ac: 0.1, grain: 0.035, vignette: 0.05, radius: [0.6, 1, 1.5] },
  { id: "raksha-bandhan", font: "--font-display-crimson", h: 55, c: 0.022, ah: 48, ac: 0.1, grain: 0.04, vignette: 0.07, radius: [0.5, 0.9, 1.3] },
  { id: "independence-day", font: "--font-display-eb-garamond", h: 70, c: 0.02, ah: 55, ac: 0.11, grain: 0.04, vignette: 0.07, radius: [0.4, 0.75, 1.1] },
  { id: "diwali", font: "--font-display-dm-serif", h: 70, c: 0.026, ah: 78, ac: 0.12, grain: 0.05, vignette: 0.12, radius: [0.45, 0.85, 1.25] },
  { id: "ugadi", font: "--font-display-lora", h: 115, c: 0.02, ah: 95, ac: 0.09, grain: 0.035, vignette: 0.05, radius: [0.55, 0.95, 1.4] },
];

const pct = (n) => `${trim(n)}%`;
const num = (n) => trim(n);

function trim(n) {
  return String(Math.round(n * 1000) / 1000);
}

function oklch(l, c, h, alpha) {
  const body = `${pct(l)} ${num(c)} ${num(h)}`;
  return alpha === undefined ? `oklch(${body})` : `oklch(${body} / ${num(alpha)})`;
}

function lightVars(theme) {
  const surfaceL = theme.surfaceL ?? 97.6;
  const accentL = theme.accentL ?? 48;
  const { h, c, ah, ac } = theme;
  const [sm, md, lg] = theme.radius;
  const shadow =
    theme.shadow ??
    `0 1px 2px rgb(0 0 0 / 0.04), 0 ${lg < 1 ? 10 : 6}px ${lg < 1 ? 28 : 20}px rgb(0 0 0 / ${lg < 1 ? 0.07 : 0.05})`;

  return `
  --color-scheme: light;

  --surface: ${oklch(surfaceL, c, h)};
  --surface-raised: ${oklch(Math.min(99.4, surfaceL + 1.4), c * 0.65, h)};
  --surface-sunken: ${oklch(surfaceL - 3.2, c * 1.25, h)};

  --ink: ${oklch(24, Math.min(c, 0.02), h)};
  --ink-muted: ${oklch(46, Math.min(c, 0.018), h)};
  --ink-faint: ${oklch(66, Math.min(c, 0.012), h)};

  --accent: ${oklch(accentL, ac, ah)};
  --accent-ink: ${oklch(98, 0.006, h)};
  --accent-soft: ${oklch(91, ac * 0.4, ah)};

  --line: ${oklch(surfaceL - 9, c, h)};
  --overlay: ${oklch(24, Math.min(c, 0.02), h, 0.35)};

  --danger: ${oklch(52, 0.16, 25)};
  --danger-ink: ${oklch(98, 0.005, 85)};

  --display-font: var(${theme.font}), ui-serif, Georgia, serif;
  --grain-opacity: ${theme.grain};
  --vignette-strength: ${theme.vignette};
  --radius-sm: ${sm}rem;
  --radius-md: ${md}rem;
  --radius-lg: ${lg}rem;
  --shadow-soft: ${shadow};
  --shadow-lift: 0 2px 6px rgb(0 0 0 / 0.06), 0 16px 36px rgb(0 0 0 / 0.08);`;
}

function darkVars(theme) {
  const { h, c, ah, ac } = theme;
  const accentL = Math.min(78, (theme.accentL ?? 48) + 26);
  return `
    --color-scheme: dark;

    --surface: ${oklch(18.5, c * 0.75, h)};
    --surface-raised: ${oklch(22.5, c * 0.85, h)};
    --surface-sunken: ${oklch(14.5, c * 0.65, h)};

    --ink: ${oklch(92, Math.min(c, 0.012), h)};
    --ink-muted: ${oklch(73, Math.min(c, 0.01), h)};
    --ink-faint: ${oklch(54, Math.min(c, 0.008), h)};

    --accent: ${oklch(accentL, ac * 0.85, ah)};
    --accent-ink: ${oklch(16, c * 0.8, h)};
    --accent-soft: ${oklch(32, ac * 0.35, ah)};

    --line: ${oklch(31, c * 0.8, h)};
    --overlay: ${oklch(8, c * 0.5, h, 0.55)};

    --danger: ${oklch(65, 0.15, 25)};
    --danger-ink: ${oklch(18, 0.01, 70)};`;
}

const blocks = themes
  .map((theme) => {
    return `/* ${theme.id} */
[data-theme="${theme.id}"] {${lightVars(theme)}
}

@media (prefers-color-scheme: dark) {
  [data-theme="${theme.id}"]:not([data-scheme="light"]) {${darkVars(theme)}
  }
}

[data-theme="${theme.id}"][data-scheme="dark"] {${darkVars(theme)}
}`;
  })
  .join("\n\n");

const source = readFileSync(file, "utf8");
const next = source.replace(
  /\/\* BEGIN generated themes \*\/[\s\S]*\/\* END generated themes \*\//,
  `/* BEGIN generated themes */\n${blocks}\n/* END generated themes */`,
);

if (next === source) {
  throw new Error("Could not find theme markers in tokens.css");
}

writeFileSync(file, next);
console.log(`Wrote ${themes.length} themes.`);
