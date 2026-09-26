import type { MetadataRoute } from "next";

import { getRequestTheme } from "@/lib/themes/active";
import { chromeColor } from "@/lib/themes/chrome-colors";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const active = await getRequestTheme();
  const color = chromeColor(active.theme.id).light;

  return {
    name: "Diary",
    short_name: "Diary",
    description: "A private daily diary. One page per day, just for you.",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    background_color: color,
    theme_color: color,
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
