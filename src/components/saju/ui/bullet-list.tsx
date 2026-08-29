import { cn } from "@/lib/utils";

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
  const markClass =
    tone === "positive" ? "text-fg" : tone === "negative" ? "text-danger" : "text-dim";
  return (
    <ul className="m-0 mb-3 list-none p-0">
      {items.map((item, i) => (
        <li key={i} className="mb-1.5 flex gap-2 text-body leading-[1.75] text-dim">
          <span className={cn("shrink-0", markClass)}>·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
