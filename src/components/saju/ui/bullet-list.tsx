import { dimText, FS } from "../constants";

export interface BulletListProps {
  items: string[];
  tone?: "positive" | "negative";
}

/**
 * "· 항목" 형태의 단순 불릿 리스트 — reading-panel.tsx의 여러 탭과
 * compatibility-section.tsx가 공유한다.
 */
export function BulletList({ items, tone }: BulletListProps) {
  if (items.length === 0) return null;
  const markColor =
    tone === "positive"
      ? "var(--fg)"
      : tone === "negative"
        ? "var(--danger)"
        : "var(--dim)";
  return (
    <ul style={{ margin: "0 0 12px", padding: 0, listStyle: "none" }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: 8,
            fontSize: FS.body,
            lineHeight: 1.75,
            marginBottom: 6,
            ...dimText,
          }}
        >
          <span style={{ color: markColor, flexShrink: 0 }}>·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
