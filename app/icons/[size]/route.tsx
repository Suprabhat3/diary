import { ImageResponse } from "next/og";

import { DiaryIconMark } from "@/components/pwa/icon-mark";

const SIZES = new Set(["180", "192", "512"]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size } = await context.params;
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const px = Number(size);
  return new ImageResponse(<DiaryIconMark size={px} />, {
    width: px,
    height: px,
  });
}
