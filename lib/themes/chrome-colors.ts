/** Browser-chrome colours. The page itself paints from tokens, not these hexes. */
const COLORS: Record<string, { light: string; dark: string }> = {
  paper: { light: "#f7f3ec", dark: "#2a2622" },
  january: { light: "#e7eef2", dark: "#1c242b" },
  february: { light: "#f6ebe8", dark: "#2a2224" },
  march: { light: "#e7f0e4", dark: "#1c261c" },
  april: { light: "#f3e8ef", dark: "#2a2228" },
  may: { light: "#e5f2e6", dark: "#1a261c" },
  june: { light: "#f7f0dc", dark: "#2a2618" },
  july: { light: "#f4efe4", dark: "#262218" },
  august: { light: "#f6edd9", dark: "#2a2418" },
  september: { light: "#f3ead9", dark: "#282116" },
  october: { light: "#f3e6d8", dark: "#2a211c" },
  november: { light: "#efe6dc", dark: "#241e1a" },
  december: { light: "#e8eef4", dark: "#1a222c" },
  birthday: { light: "#f8efd8", dark: "#2c2418" },
  "new-year": { light: "#eef1f4", dark: "#1c2228" },
  valentines: { light: "#f8e8ec", dark: "#2c1e22" },
  halloween: { light: "#f6e6d4", dark: "#2a1e16" },
  christmas: { light: "#e7f0e8", dark: "#1a241c" },
  "new-years-eve": { light: "#e8eaf2", dark: "#161820" },
  holi: { light: "#f7e8f2", dark: "#2a1e28" },
  "raksha-bandhan": { light: "#f8eadf", dark: "#2a201c" },
  "independence-day": { light: "#f6ecdf", dark: "#241e18" },
  diwali: { light: "#f8ecd4", dark: "#2a2214" },
  ugadi: { light: "#eaf3e4", dark: "#1c2618" },
};

export function chromeColor(themeId: string): { light: string; dark: string } {
  return COLORS[themeId] ?? COLORS.paper;
}
