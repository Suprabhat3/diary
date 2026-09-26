/**
 * Every diary read and write must take the user id from the session.
 * This fails if a data or action function accepts `userId` from its caller,
 * or if those modules forget `server-only` / `getSession()`.
 *
 *   pnpm audit:isolation
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = [join("lib", "data"), join("lib", "actions")];

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else if (path.endsWith(".ts")) files.push(path);
  }
  return files;
}

const failures: string[] = [];
const files = roots.flatMap((root) => walk(root));

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const normalized = file.split("\\").join("/");
  if (normalized.includes("/data/") && !source.includes('import "server-only"') && !source.includes("import 'server-only'")) {
    failures.push(`${file} is missing server-only`);
  }
  if (normalized.includes("/actions/") && !source.includes('"use server"') && !source.includes("'use server'")) {
    failures.push(`${file} is missing use server`);
  }
  if (/function\s+\w+\s*\([^)]*\buserId\b/.test(source)) {
    failures.push(`${file} accepts userId as a parameter`);
  }
  if (/userId:\s*z\./.test(source)) {
    failures.push(`${file} validates userId from the caller`);
  }
}

const sessionFiles = [
  join("lib", "data", "entries.ts"),
  join("lib", "data", "profile.ts"),
  join("lib", "data", "backup.ts"),
  join("lib", "data", "account.ts"),
  join("lib", "actions", "entries.ts"),
  join("lib", "actions", "profile.ts"),
  join("lib", "actions", "backup.ts"),
  join("lib", "actions", "account.ts"),
];

for (const file of sessionFiles) {
  const source = readFileSync(file, "utf8");
  if (!source.includes("getSession(")) {
    failures.push(`${file} never calls getSession()`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`isolation audit passed (${files.length} files)`);
