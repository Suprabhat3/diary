import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Color = { l: number; c: number; h: number };

const css = readFileSync(join(process.cwd(), "lib", "themes", "tokens.css"), "utf8");
const ids = [...css.matchAll(/\[data-theme="([^"]+)"\]\s*\{/g)].map((match) => match[1]);
const themes = [...new Set(ids)];

function block(id: string, scheme: "light" | "dark"): string {
  const selector =
    scheme === "light"
      ? `\\[data-theme="${id}"\\]\\s*`
      : `\\[data-theme="${id}"\\]\\[data-scheme="dark"\\]\\s*`;
  const match = new RegExp(`${selector}\\{([^}]+)\\}`, "m").exec(css);
  assert.ok(match?.[1], `missing ${scheme} token block for ${id}`);
  return match[1];
}

function token(source: string, name: string): Color {
  const match = new RegExp(
    `--${name}:\\s*oklch\\(([\\d.]+)%\\s+([\\d.]+)\\s+([\\d.]+)(?:\\s*\\/[^)]+)?\\)`,
  ).exec(source);
  assert.ok(match, `missing or unsupported --${name}`);
  return {
    l: Number(match[1]) / 100,
    c: Number(match[2]),
    h: Number(match[3]),
  };
}

function luminance(color: Color): number {
  const angle = (color.h * Math.PI) / 180;
  const a = color.c * Math.cos(angle);
  const b = color.c * Math.sin(angle);

  const lRoot = color.l + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = color.l - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = color.l - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;

  const red = Math.max(0, Math.min(1, 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s));
  const green = Math.max(0, Math.min(1, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s));
  const blue = Math.max(0, Math.min(1, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function ratio(first: Color, second: Color): number {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + 0.05) / (dark + 0.05);
}

const pairs = [
  ["ink", "surface", 7],
  ["ink-muted", "surface", 4.5],
  ["ink-faint", "surface", 3],
  ["accent-ink", "accent", 4.5],
  ["danger-ink", "danger", 4.5],
] as const;

const failures: string[] = [];
for (const id of themes) {
  for (const scheme of ["light", "dark"] as const) {
    const source = block(id, scheme);
    for (const [foreground, background, minimum] of pairs) {
      const contrast = ratio(token(source, foreground), token(source, background));
      if (contrast + Number.EPSILON < minimum) {
        failures.push(
          `${id}/${scheme} --${foreground} on --${background}: ${contrast.toFixed(2)} < ${minimum}`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Theme contrast failures:\n${failures.join("\n")}`);
}

console.log(`theme contrast passed (${themes.length} themes × 2 schemes)`);
