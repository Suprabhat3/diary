import { DISPLAY_FONTS } from "./font-names";
import { MONTH_IDS } from "./types";
import type { ThemeId, ThemeManifest } from "./types";

const day = (
  morning: string,
  afternoon: string,
  evening: string,
  night: string,
): ThemeManifest["greetings"] => ({ morning, afternoon, evening, night });

function theme(
  id: ThemeId,
  label: string,
  displayFont: string | null,
  motion: ThemeManifest["motion"],
  greetings: ThemeManifest["greetings"],
  emptyPrompt: string,
  occasion: string | null = null,
): ThemeManifest {
  return { id, label, displayFont, motion, greetings, emptyPrompt, occasion };
}

export const themes = {
  paper: theme(
    "paper",
    "Diary",
    null,
    "fade",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "A blank page. Write whatever the day was.",
  ),
  january: theme(
    "january",
    "January",
    DISPLAY_FONTS.cormorant,
    "settle",
    day(
      "A quiet morning, {name}.",
      "Good afternoon, {name}.",
      "The evening is still, {name}.",
      "The house is quiet, {name}.",
    ),
    "A blank page is a fine place to start the year.",
  ),
  february: theme(
    "february",
    "February",
    DISPLAY_FONTS.libre,
    "settle",
    day(
      "Good morning, {name}.",
      "A short afternoon, {name}.",
      "Good evening, {name}.",
      "Still awake, {name}.",
    ),
    "Say it simply. The month is short.",
  ),
  march: theme(
    "march",
    "March",
    DISPLAY_FONTS.fraunces,
    "drift",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "The light is changing, {name}.",
      "Hello, {name}.",
    ),
    "Whatever thawed, write it down.",
  ),
  april: theme(
    "april",
    "April",
    DISPLAY_FONTS.lora,
    "drift",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "The night is soft, {name}.",
    ),
    "Begin in the middle if you need to.",
  ),
  may: theme(
    "may",
    "May",
    DISPLAY_FONTS.literata,
    "drift",
    day(
      "Good morning, {name}.",
      "A bright afternoon, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "Leave the day here, lightly.",
  ),
  june: theme(
    "june",
    "June",
    DISPLAY_FONTS.sourceSerif,
    "fade",
    day(
      "Good morning, {name}.",
      "The afternoon is long, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "Long light. A few honest lines are enough.",
  ),
  july: theme(
    "july",
    "July",
    DISPLAY_FONTS.dmSerif,
    "fade",
    day(
      "Good morning, {name}.",
      "A hot afternoon, {name}.",
      "The day is cooling, {name}.",
      "Still warm out, {name}.",
    ),
    "Write what the heat made quiet.",
  ),
  august: theme(
    "august",
    "August",
    DISPLAY_FONTS.ebGaramond,
    "settle",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "The day can be ordinary. That's worth keeping.",
  ),
  september: theme(
    "september",
    "September",
    DISPLAY_FONTS.spectral,
    "drift",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "The evenings are drawing in, {name}.",
      "Hello, {name}.",
    ),
    "A new season. Start with one true sentence.",
  ),
  october: theme(
    "october",
    "October",
    DISPLAY_FONTS.bodoni,
    "settle",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "The evening comes early, {name}.",
      "The dark is in, {name}.",
    ),
    "The evening comes early. So can this page.",
  ),
  november: theme(
    "november",
    "November",
    DISPLAY_FONTS.crimson,
    "settle",
    day(
      "A grey morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "Darker days. The page stays warm.",
  ),
  december: theme(
    "december",
    "December",
    DISPLAY_FONTS.playfair,
    "settle",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "The year is late, {name}.",
    ),
    "Close the year the way it actually felt.",
  ),
  birthday: theme(
    "birthday",
    "Birthday",
    DISPLAY_FONTS.birthday,
    "drift",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "A day that is yours. Write whatever you want.",
    "Happy birthday, {name}.",
  ),
  "new-year": theme(
    "new-year",
    "New Year",
    DISPLAY_FONTS.cormorant,
    "fade",
    day(
      "A new morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "The first page of the year. Keep it honest.",
    "Happy New Year, {name}.",
  ),
  valentines: theme(
    "valentines",
    "Valentine's Day",
    DISPLAY_FONTS.libre,
    "drift",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "Write to the day, or to someone in it.",
    "Happy Valentine's Day, {name}.",
  ),
  halloween: theme(
    "halloween",
    "Halloween",
    DISPLAY_FONTS.bodoni,
    "fade",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "The evening is here, {name}.",
      "All Hallows, {name}.",
    ),
    "A darker page. That's allowed.",
    "Happy Halloween, {name}.",
  ),
  christmas: theme(
    "christmas",
    "Christmas",
    DISPLAY_FONTS.playfair,
    "settle",
    day(
      "Christmas morning, {name}.",
      "Good afternoon, {name}.",
      "Christmas evening, {name}.",
      "Hello, {name}.",
    ),
    "Keep the day as it was, not as it was supposed to be.",
    "Merry Christmas, {name}.",
  ),
  "new-years-eve": theme(
    "new-years-eve",
    "New Year's Eve",
    DISPLAY_FONTS.playfair,
    "fade",
    day(
      "The last morning, {name}.",
      "The last afternoon, {name}.",
      "The last evening, {name}.",
      "Almost midnight, {name}.",
    ),
    "One last page for this year.",
    "The year is almost over, {name}.",
  ),
  holi: theme(
    "holi",
    "Holi",
    DISPLAY_FONTS.fraunces,
    "drift",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "Colour in the day however it actually went.",
    "Happy Holi, {name}.",
  ),
  "raksha-bandhan": theme(
    "raksha-bandhan",
    "Raksha Bandhan",
    DISPLAY_FONTS.crimson,
    "settle",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "A thread of a day. Write who it was for.",
    "Happy Raksha Bandhan, {name}.",
  ),
  "independence-day": theme(
    "independence-day",
    "Independence Day",
    DISPLAY_FONTS.ebGaramond,
    "settle",
    day(
      "Good morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "The fifteenth. Write the day you actually had.",
    "Happy Independence Day, {name}.",
  ),
  diwali: theme(
    "diwali",
    "Diwali",
    DISPLAY_FONTS.dmSerif,
    "settle",
    day(
      "Diwali morning, {name}.",
      "Good afternoon, {name}.",
      "The lamps are lit, {name}.",
      "Hello, {name}.",
    ),
    "A bright evening. Keep what it felt like.",
    "Happy Diwali, {name}.",
  ),
  ugadi: theme(
    "ugadi",
    "Ugadi",
    DISPLAY_FONTS.lora,
    "drift",
    day(
      "A new morning, {name}.",
      "Good afternoon, {name}.",
      "Good evening, {name}.",
      "Hello, {name}.",
    ),
    "The new year in this calendar. Begin where you are.",
    "Happy New Year, {name}.",
  ),
} satisfies Record<ThemeId, ThemeManifest>;

export function themeById(id: string | null | undefined): ThemeManifest | null {
  if (!id) return null;
  if (Object.prototype.hasOwnProperty.call(themes, id)) {
    return themes[id as ThemeId];
  }
  return null;
}

export function monthTheme(month: number): ThemeManifest {
  const id = MONTH_IDS[month - 1];
  return id ? themes[id] : themes.january;
}

/** Every theme a person can preview, wear, or lock. Paper is only the signed-out fallback. */
export function wearableThemes(): ThemeManifest[] {
  return Object.values(themes).filter((theme) => theme.id !== "paper");
}
