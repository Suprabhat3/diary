import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { headers } from "next/headers";

import { isNeutralChromePath } from "@/lib/auth/paths";
import { displayFontVariables } from "@/lib/themes/fonts";
import { getActiveTheme } from "@/lib/themes/active";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The app runs standalone from a home screen, so it owns the notch and the
  // home indicator. Panels read their insets via the pad-safe-* utilities.
  viewportFit: "cover",
  // Keep the writing area above the on-screen keyboard rather than letting the
  // browser scroll the whole page out from under it.
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Resolved on the server, so the first byte of HTML already carries the
  // right theme. Auth screens stay on paper. There is no client theme flash.
  const pathname = (await headers()).get("x-diary-path") ?? "";
  const active = isNeutralChromePath(pathname) ? null : await getActiveTheme();
  const themeId = active?.theme.id ?? "paper";

  return (
    <html
      lang="en"
      data-theme={themeId}
      className={`${bodySerif.variable} ${uiSans.variable} ${displayFontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
