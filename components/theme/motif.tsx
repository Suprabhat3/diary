import type { ThemeId } from "@/lib/themes/types";

export function Motif({ id }: { id: ThemeId }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="size-8 text-brand"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <MotifShape id={id} />
    </svg>
  );
}

function MotifShape({ id }: { id: ThemeId }) {
  switch (id) {
    case "january":
      return <path d="M16 6v4M16 22v4M6 16h4M22 16h4M9 9l2.5 2.5M20.5 20.5 23 23M23 9l-2.5 2.5M11.5 20.5 9 23" />;
    case "february":
      return <path d="M16 26s-8-5.2-8-11a4.5 4.5 0 0 1 8-2 4.5 4.5 0 0 1 8 2c0 5.8-8 11-8 11z" />;
    case "march":
      return <path d="M16 26c0-8 6-10 6-16-4 2-6 6-6 6s-2-4-6-6c0 6 6 8 6 16z" />;
    case "april":
      return <path d="M16 26V14M16 14c-4-1-7-5-6-8 4 1 6 5 6 8zM16 16c4-1 7-4 6-7-4 1-6 4-6 7z" />;
    case "may":
      return <path d="M16 26V8M12 14c2 2 4 2 4 2s2 0 4-2M11 18c2.2 1.6 5 1.6 5 1.6s2.8 0 5-1.6" />;
    case "june":
      return <circle cx="16" cy="16" r="5" />;
    case "july":
      return <path d="M16 7v3M16 22v3M7 16h3M22 16h3M9.5 9.5l2 2M20.5 20.5l2 2M22.5 9.5l-2 2M11.5 20.5l-2 2" />;
    case "august":
      return <path d="M8 22c4-8 12-8 16 0M10 18c3-5 9-5 12 0" />;
    case "september":
      return <path d="M16 6c2 6-2 8 0 14M16 8c4 2 6 6 4 12M12 20h8" />;
    case "october":
      return <path d="M16 6c-4 6-4 10 0 20 4-10 4-14 0-20z" />;
    case "november":
      return <path d="M8 22c2-6 4-8 8-14 4 6 6 8 8 14M11 22h10" />;
    case "december":
      return <path d="M16 6l1.6 4.8H22l-3.8 2.8 1.5 4.8L16 16.2 12.3 18.4l1.5-4.8L10 10.8h4.4z" />;
    case "birthday":
      return <path d="M10 22h12v-6H10zM12 16v-2M16 16v-3M20 16v-2M16 8c0 2 2 2 2 0" />;
    case "new-year":
    case "new-years-eve":
      return <path d="M16 6v2M16 24v2M6 16h2M24 16h2M9 9l1.5 1.5M21.5 21.5 23 23M23 9l-1.5 1.5M10.5 21.5 9 23M16 12v4l3 2" />;
    case "valentines":
      return <path d="M16 25s-7-4.4-7-9.5A3.8 3.8 0 0 1 16 13a3.8 3.8 0 0 1 7 2.5C23 20.6 16 25 16 25z" />;
    case "halloween":
      return <path d="M9 18c0-5 3-9 7-9s7 4 7 9v4H9zM13 17h.1M19 17h.1M14 21c1 1 3 1 4 0" />;
    case "christmas":
      return <path d="M16 6l4 6h-2l3 5h-2l3 6H10l3-6H11l3-5h-2z" />;
    case "holi":
      return (
        <>
          <circle cx="12" cy="14" r="2" />
          <circle cx="20" cy="13" r="2" />
          <circle cx="16" cy="20" r="2" />
        </>
      );
    case "raksha-bandhan":
      return <path d="M8 16h16M12 16c0 4 8 4 8 0" />;
    case "independence-day":
      return <path d="M10 8v16M10 8h10l-2 3 2 3H10" />;
    case "diwali":
      return <path d="M11 22h10M12 22c0-6 8-6 8 0M16 12c0 3 2 3 2 0" />;
    case "ugadi":
      return <path d="M16 26V10M16 14c-5 0-6-4-4-6 3 2 4 4 4 6zM16 12c4 0 6-3 4-6-3 2-4 4-4 6z" />;
    case "paper":
      return <path d="M10 8h8l4 4v12H10zM18 8v4h4" />;
  }
}
