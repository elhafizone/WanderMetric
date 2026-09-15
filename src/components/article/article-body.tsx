import Link from "next/link";

import type { Block, Inline } from "@/lib/article/body";

/**
 * Renders a parsed article body.
 *
 * A Server Component with no client JavaScript: every word of the article is in
 * the HTML the crawler and the reader both receive on first paint. Nothing here
 * is wrapped in a motion component, because a reveal on a paragraph is the
 * fastest way to make a long read feel like a slideshow — and because content
 * that depends on script to become visible is content that can fail to appear.
 *
 * Typography lives in the `.article` block in globals.css rather than in class
 * attributes on each element. Two reasons: the rhythm between a heading and the
 * paragraph above it is a *relationship*, which CSS sibling selectors express
 * and per-element utilities cannot; and an editor who later adds a heading gets
 * the correct spacing without anyone editing this file.
 *
 * There is no `dangerouslySetInnerHTML` anywhere in this component. Stored body
 * text reaches the DOM only as React text children, so it is escaped by
 * construction and stored XSS remains structurally impossible.
 */
export function ArticleBody({
  blocks,
  /**
   * A drop cap is set on the opening paragraph only when the article actually
   * opens with prose. An article that opens on a heading or a quote gets none —
   * a floated capital next to a section title reads as a mistake, not as
   * typography.
   */
  dropCap = true,
  className,
}: {
  blocks: Block[];
  dropCap?: boolean;
  className?: string;
}) {
  if (blocks.length === 0) return null;

  // The drop cap belongs to the article's opening paragraph and only when the
  // article opens on one. An article that starts with a heading or a quote gets
  // none: a floated capital beside a section title reads as a mistake rather
  // than as typography.
  const ledeIndex = blocks[0]?.kind === "paragraph" ? 0 : -1;

  return (
    <div className={`article ${className ?? ""}`}>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "heading": {
            const Tag = block.level === 2 ? "h2" : "h3";
            return (
              // `scroll-mt` keeps an anchored heading clear of the fixed
              // masthead when the table of contents jumps to it.
              <Tag key={index} id={block.id} className="scroll-mt-28">
                {block.text}
              </Tag>
            );
          }

          case "paragraph":
            return (
              <p
                key={index}
                className={dropCap && index === ledeIndex ? "lede" : undefined}
              >
                <InlineContent nodes={block.content} />
              </p>
            );

          case "quote":
            return (
              <blockquote key={index}>
                <p>
                  <InlineContent nodes={block.content} />
                </p>
              </blockquote>
            );

          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag key={index}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <InlineContent nodes={item} />
                  </li>
                ))}
              </Tag>
            );
          }

          case "note":
            return (
              <aside key={index} className="article-note">
                <p className="eyebrow text-accent">{block.label}</p>
                <p>
                  <InlineContent nodes={block.content} />
                </p>
              </aside>
            );
        }
      })}
    </div>
  );
}

function InlineContent({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.kind) {
          case "text":
            return node.value;
          case "strong":
            return (
              <strong key={index}>
                <InlineContent nodes={node.children} />
              </strong>
            );
          case "emphasis":
            return (
              <em key={index}>
                <InlineContent nodes={node.children} />
              </em>
            );
          case "link": {
            const external = node.href.startsWith("https://");
            // Internal links go through next/link so a reader moving between
            // guides gets a client transition rather than a full reload.
            if (external || node.href.startsWith("mailto:")) {
              return (
                <a
                  key={index}
                  href={node.href}
                  {...(external ? { rel: "noopener", target: "_blank" } : {})}
                >
                  <InlineContent nodes={node.children} />
                </a>
              );
            }
            return (
              <Link key={index} href={node.href}>
                <InlineContent nodes={node.children} />
              </Link>
            );
          }
        }
      })}
    </>
  );
}
