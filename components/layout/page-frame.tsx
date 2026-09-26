import type { ReactNode } from "react";

export function PageFrame({
  children,
  width = "reading",
}: {
  children: ReactNode;
  width?: "reading" | "wide";
}) {
  const max = width === "wide" ? "max-w-3xl" : "max-w-lg";
  return <div className={`mx-auto flex w-full ${max} flex-1 flex-col px-5 py-6`}>{children}</div>;
}
