import type { DiaryBlock, DiaryDoc, TextNode } from "@/lib/editor/document";

export function EntryBody({ doc }: { doc: DiaryDoc }) {
  const hasText = doc.content.some((block) => blockHasText(block));
  if (!hasText) return null;

  return (
    <div className="diary-prose text-lg leading-relaxed text-ink">
      {doc.content.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}

function blockHasText(block: DiaryBlock): boolean {
  if (block.type === "paragraph" || block.type === "heading") {
    return (block.content ?? []).some((node) => node.text.trim().length > 0);
  }
  if (block.type === "blockquote") return block.content.some(blockHasText);
  return block.content.some((item) => item.content.some(blockHasText));
}

function Inlines({ content }: { content?: TextNode[] }) {
  return (
    <>
      {(content ?? []).map((node, index) => {
        const bold = node.marks?.some((mark) => mark.type === "bold");
        const italic = node.marks?.some((mark) => mark.type === "italic");
        if (bold && italic) return <strong key={index}><em>{node.text}</em></strong>;
        if (bold) return <strong key={index}>{node.text}</strong>;
        if (italic) return <em key={index}>{node.text}</em>;
        return <span key={index}>{node.text}</span>;
      })}
    </>
  );
}

function BlockView({ block }: { block: DiaryBlock }) {
  if (block.type === "heading" && block.attrs.level === 3) {
    return (
      <h3 className="mt-4 font-display text-xl">
        <Inlines content={block.content} />
      </h3>
    );
  }
  if (block.type === "heading") {
    return (
      <h2 className="mt-5 font-display text-2xl">
        <Inlines content={block.content} />
      </h2>
    );
  }
  if (block.type === "blockquote") {
    return (
      <blockquote>
        {block.content.map((inner, index) => (
          <BlockView key={index} block={inner} />
        ))}
      </blockquote>
    );
  }
  if (block.type === "bulletList" || block.type === "orderedList") {
    const Tag = block.type === "orderedList" ? "ol" : "ul";
    return (
      <Tag>
        {block.content.map((item, index) => (
          <li key={index}>
            {item.content.map((inner, innerIndex) => (
              <BlockView key={innerIndex} block={inner} />
            ))}
          </li>
        ))}
      </Tag>
    );
  }
  return (
    <p>
      <Inlines content={block.content} />
    </p>
  );
}
