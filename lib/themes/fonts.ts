import {
  Bodoni_Moda,
  Cormorant_Garamond,
  Crimson_Pro,
  DM_Serif_Display,
  EB_Garamond,
  Fraunces,
  Libre_Baskerville,
  Literata,
  Lora,
  Playfair_Display,
  Source_Serif_4,
  Spectral,
} from "next/font/google";

/**
 * One display face per mood. `preload: false` on every face — the active
 * theme is the only one referenced from `font-family`, so the browser
 * fetches that file and leaves the rest alone.
 *
 * Every option is a literal. Next's font loader rejects imported constants.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "500",
  variable: "--font-display-cormorant",
});

const birthday = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "500",
  style: "italic",
  variable: "--font-display-birthday",
});

const libre = Libre_Baskerville({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--font-display-libre",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "500",
  variable: "--font-display-fraunces",
});

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "500",
  variable: "--font-display-lora",
});

const literata = Literata({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "500",
  variable: "--font-display-literata",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "500",
  variable: "--font-display-source-serif",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--font-display-dm-serif",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "500",
  variable: "--font-display-eb-garamond",
});

const spectral = Spectral({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "500",
  variable: "--font-display-spectral",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "500",
  variable: "--font-display-bodoni",
});

const crimson = Crimson_Pro({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "500",
  variable: "--font-display-crimson",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "500",
  variable: "--font-display-playfair",
});

const faces = [
  cormorant,
  birthday,
  libre,
  fraunces,
  lora,
  literata,
  sourceSerif,
  dmSerif,
  ebGaramond,
  spectral,
  bodoni,
  crimson,
  playfair,
];

/** Every display variable, so a theme can select one without a flash. */
export const displayFontVariables = faces.map((face) => face.variable).join(" ");
