import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const ART_LIMIT = 120 * 1024;
const EDITOR_ROUTE_LIMIT = 150 * 1024;
const failures: string[] = [];

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const themeRoot = join(process.cwd(), "public", "themes");
const art = walk(themeRoot).filter((path) => /bg-(light|dark)\.(avif|webp)$/i.test(path));
for (const path of art) {
  const bytes = statSync(path).size;
  if (bytes > ART_LIMIT) {
    failures.push(`${relative(process.cwd(), path)} is ${bytes} bytes; limit is ${ART_LIMIT}`);
  }
}

const nextRoot = join(process.cwd(), ".next");
if (existsSync(nextRoot)) {
  const manifests = [
    join(nextRoot, "server", "app", "(app)", "today", "page", "react-loadable-manifest.json"),
    join(nextRoot, "server", "app", "(app)", "day", "[date]", "page", "react-loadable-manifest.json"),
  ];

  for (const manifestPath of manifests) {
    if (!existsSync(manifestPath)) {
      failures.push(`missing route bundle manifest: ${relative(process.cwd(), manifestPath)}`);
      continue;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<
      string,
      { files?: string[] }
    >;
    const files = [...new Set(Object.values(manifest).flatMap((entry) => entry.files ?? []))];
    const gzipBytes = files.reduce((total, file) => {
      const path = join(nextRoot, file);
      if (!existsSync(path)) {
        failures.push(`missing route chunk: ${relative(process.cwd(), path)}`);
        return total;
      }
      return total + gzipSync(readFileSync(path)).byteLength;
    }, 0);

    if (gzipBytes > EDITOR_ROUTE_LIMIT) {
      failures.push(
        `${relative(process.cwd(), manifestPath)} dynamic chunks are ${gzipBytes} gzip bytes; limit is ${EDITOR_ROUTE_LIMIT}`,
      );
    }
  }
} else {
  console.log("bundle budget skipped (.next is absent; run after pnpm build)");
}

if (art.length === 0) {
  console.log("art budget ready (final theme artwork is deferred)");
} else {
  console.log(`art budget passed (${art.length} variants)`);
}

if (failures.length > 0) {
  throw new Error(`Budget failures:\n${failures.join("\n")}`);
}

if (existsSync(nextRoot)) console.log("editor route bundle budgets passed");
