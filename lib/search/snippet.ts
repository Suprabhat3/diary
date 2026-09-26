export type SnippetPart = { text: string; hit: boolean };

/** Splits a Postgres `ts_headline` string that uses « » around matches. */
export function splitHighlights(raw: string): SnippetPart[] {
  const parts: SnippetPart[] = [];
  const chunks = raw.split("«");
  chunks.forEach((chunk, index) => {
    if (index === 0) {
      if (chunk) parts.push({ text: chunk, hit: false });
      return;
    }
    const [hit, rest = ""] = chunk.split("»");
    if (hit) parts.push({ text: hit, hit: true });
    if (rest) parts.push({ text: rest, hit: false });
  });
  return parts;
}

export function plainSnippet(text: string, max = 180): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}
