import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { headers } from "next/headers";

import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { isNeutralChromePath } from "@/lib/auth/paths";
import { getRequestTheme } from "@/lib/themes/active";
import { chromeColor } from "@/lib/themes/chrome-colors";
import { displayFontVariables } from "@/lib/themes/fonts";

import "./globals.css";

/**
 * The body serif. Deliberately the SAME in every theme -- you should not have
 * to re-learn how your own diary reads each month. Themes carry their
 * personality in the display face, swapped per theme.
 */
const bodySerif = Newsreader({
  variable: "--font-body-serif",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

/** Chrome only: navigation, buttons, labels. Never the writing surface. */
const uiSans = Inter({
  variable: "--font-ui-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diary",
  description: "A private daily diary. One page per day, just for you.",
  applicationName: "Diary",
  appleWebApp: {
    capable: true,
    title: "Diary",
    statusBarStyle: "default",
  },
  robots: { index: false, follow: false },
};

export async function generateViewport(): Promise<Viewport> {
  const pathname = (await headers()).get("x-diary-path") ?? "";
  const neutral = isNeutralChromePath(pathname) || pathname === "/offline";
  const colors = chromeColor(neutral ? "paper" : (await getRequestTheme()).theme.id);

  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    interactiveWidget: "resizes-content",
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: colors.light },
      { media: "(prefers-color-scheme: dark)", color: colors.dark },
    ],
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Resolved on the server, so the first byte of HTML already carries the
  // right theme. Auth screens stay on paper. There is no client theme flash.
  const pathname = (await headers()).get("x-diary-path") ?? "";
  const neutral = isNeutralChromePath(pathname) || pathname === "/offline";
  const active = neutral ? null : await getRequestTheme();
  const themeId = active?.theme.id ?? "paper";

  return (
    <html
      lang="en"
      data-theme={themeId}
      className={`${bodySerif.variable} ${uiSans.variable} ${displayFontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
