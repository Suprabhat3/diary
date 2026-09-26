import { isMood, type Mood } from "./moods";

export type MarkName = "bold" | "italic";

export type TextNode = {
  type: "text";
  text: string;
  marks?: { type: MarkName }[];
};

export type ParagraphBlock = { type: "paragraph"; content?: TextNode[] };
export type HeadingBlock = {
  type: "heading";
  attrs: { level: 2 | 3 };
  content?: TextNode[];
};
export type BlockquoteBlock = { type: "blockquote"; content: DiaryBlock[] };
export type ListItemBlock = { type: "listItem"; content: DiaryBlock[] };
export type BulletListBlock = { type: "bulletList"; content: ListItemBlock[] };
export type OrderedListBlock = { type: "orderedList"; content: ListItemBlock[] };

export type DiaryBlock =
  | ParagraphBlock
  | HeadingBlock
  | BlockquoteBlock
  | BulletListBlock
  | OrderedListBlock;

export type DiaryDoc = { type: "doc"; content: DiaryBlock[] };

export const EMPTY_DOC: DiaryDoc = { type: "doc", content: [{ type: "paragraph" }] };

const MAX_JSON_CHARS = 400_000;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function sanitizeDocument(input: unknown): {
  doc: DiaryDoc;
  text: string;
  wordCount: number;
} {
  let raw = "";
  try {
    raw = JSON.stringify(input);
  } catch {
    return { doc: EMPTY_DOC, text: "", wordCount: 0 };
  }
  if (!raw || raw.length > MAX_JSON_CHARS || !input || typeof input !== "object") {
    return { doc: EMPTY_DOC, text: "", wordCount: 0 };
  }
  if ((input as { type?: unknown }).type !== "doc") {
    return { doc: EMPTY_DOC, text: "", wordCount: 0 };
  }

  const blocks = sanitizeBlocks(asArray((input as { content?: unknown }).content), 0);
  const doc: DiaryDoc = {
    type: "doc",
    content: blocks.length > 0 ? blocks : [{ type: "paragraph" }],
  };
  const text = blocksToText(doc.content).replace(/\n{3,}/g, "\n\n").trim();
  return { doc, text, wordCount: countWords(text) };
}

export function documentToMarkdown(doc: DiaryDoc): string {
  return doc.content.map((block) => blockToMarkdown(block, 0)).filter(Boolean).join("\n\n");
}

export function moodOrNull(value: unknown): Mood | null {
  return isMood(value) ? value : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function sanitizeBlocks(nodes: unknown[], depth: number): DiaryBlock[] {
  if (depth > 12) return [];
  const blocks: DiaryBlock[] = [];
  for (const node of nodes) {
    const block = sanitizeBlock(node, depth);
    if (block) blocks.push(block);
  }
  return blocks;
}

function sanitizeBlock(node: unknown, depth: number): DiaryBlock | null {
  if (!node || typeof node !== "object") return null;
  const type = (node as { type?: unknown }).type;
  const content = (node as { content?: unknown }).content;

  if (type === "paragraph") {
    const inlines = sanitizeInlines(content);
    return inlines.length > 0 ? { type: "paragraph", content: inlines } : { type: "paragraph" };
  }

  if (type === "heading") {
    const levelRaw = (node as { attrs?: { level?: unknown } }).attrs?.level;
    const level: 2 | 3 = levelRaw === 3 ? 3 : 2;
    const inlines = sanitizeInlines(content);
    if (inlines.length === 0) return null;
    return { type: "heading", attrs: { level }, content: inlines };
  }

  if (type === "blockquote") {
    const inner = sanitizeBlocks(asArray(content), depth + 1).filter(
      (block) => block.type === "paragraph" || block.type === "heading",
    );
    if (inner.length === 0) return null;
    return { type: "blockquote", content: inner };
  }

  if (type === "bulletList" || type === "orderedList") {
    const items = asArray(content)
      .map((item) => sanitizeListItem(item, depth))
      .filter((item): item is ListItemBlock => item !== null);
    if (items.length === 0) return null;
    return { type, content: items };
  }

  const loose = collectLooseText(node).trim();
  if (!loose) return null;
  return { type: "paragraph", content: [{ type: "text", text: loose }] };
}

function sanitizeListItem(node: unknown, depth: number): ListItemBlock | null {
  if (!node || typeof node !== "object" || (node as { type?: unknown }).type !== "listItem") {
    return null;
  }
  const content = sanitizeBlocks(asArray((node as { content?: unknown }).content), depth + 1).filter(
    (block) => block.type === "paragraph" || block.type === "heading",
  );
  if (content.length === 0) return null;
  return { type: "listItem", content };
}

function sanitizeInlines(content: unknown): TextNode[] {
  const nodes: TextNode[] = [];
  for (const node of asArray(content)) {
    if (!node || typeof node !== "object" || (node as { type?: unknown }).type !== "text") {
      const loose = collectLooseText(node).trim();
      if (loose) nodes.push({ type: "text", text: loose });
      continue;
    }
    const text = (node as { text?: unknown }).text;
    if (typeof text !== "string" || text.length === 0) continue;
    const marks = sanitizeMarks((node as { marks?: unknown }).marks);
    nodes.push(marks.length > 0 ? { type: "text", text, marks } : { type: "text", text });
  }
  return nodes;
}

function sanitizeMarks(marks: unknown): { type: MarkName }[] {
  if (!Array.isArray(marks)) return [];
  const kept: { type: MarkName }[] = [];
  for (const mark of marks) {
    const type = (mark as { type?: unknown })?.type;
    if ((type === "bold" || type === "italic") && !kept.some((item) => item.type === type)) {
      kept.push({ type });
    }
  }
  return kept;
}

function collectLooseText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  if ((node as { type?: unknown }).type === "text" && typeof (node as { text?: unknown }).text === "string") {
    return (node as { text: string }).text;
  }
  return asArray((node as { content?: unknown }).content).map(collectLooseText).join("");
}

function inlinesToText(content?: TextNode[]): string {
  return (content ?? []).map((node) => node.text).join("");
}

function blocksToText(blocks: DiaryBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === "paragraph" || block.type === "heading") return inlinesToText(block.content);
      if (block.type === "blockquote") return blocksToText(block.content);
      return block.content
        .map((item) => blocksToText(item.content))
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

function inlineMarkdown(content?: TextNode[]): string {
  return (content ?? [])
    .map((node) => {
      let text = node.text;
      if (node.marks?.some((mark) => mark.type === "italic")) text = `*${text}*`;
      if (node.marks?.some((mark) => mark.type === "bold")) text = `**${text}**`;
      return text;
    })
    .join("");
}

function blockToMarkdown(block: DiaryBlock, depth: number): string {
  if (block.type === "heading") {
    const marks = block.attrs.level === 3 ? "### " : "## ";
    return `${marks}${inlineMarkdown(block.content)}`;
  }
  if (block.type === "paragraph") return inlineMarkdown(block.content);
  if (block.type === "blockquote") {
    return block.content
      .map((inner) => blockToMarkdown(inner, depth))
      .filter(Boolean)
      .map((line) =>
        line
          .split("\n")
          .map((part) => `> ${part}`)
          .join("\n"),
      )
      .join("\n>\n");
  }
  return block.content
    .map((item, index) => {
      const body = item.content.map((inner) => blockToMarkdown(inner, depth + 1)).join("\n");
      const prefix = block.type === "orderedList" ? `${index + 1}. ` : "- ";
      return `${prefix}${body}`;
    })
    .join("\n");
}
