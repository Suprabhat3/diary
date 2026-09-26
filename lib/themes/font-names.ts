/** CSS variables defined by `next/font` in `fonts.ts`. Themes point at one of these. */
export const DISPLAY_FONTS = {
  cormorant: "--font-display-cormorant",
  libre: "--font-display-libre",
  fraunces: "--font-display-fraunces",
  lora: "--font-display-lora",
  literata: "--font-display-literata",
  sourceSerif: "--font-display-source-serif",
  dmSerif: "--font-display-dm-serif",
  ebGaramond: "--font-display-eb-garamond",
  spectral: "--font-display-spectral",
  bodoni: "--font-display-bodoni",
  crimson: "--font-display-crimson",
  playfair: "--font-display-playfair",
  birthday: "--font-display-birthday",
} as const;

export type DisplayFont = (typeof DISPLAY_FONTS)[keyof typeof DISPLAY_FONTS];
