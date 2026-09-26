import type { ThemeManifest } from "./types";

export function themeGreeting(theme: ThemeManifest, name: string, hour: number): string {
  const template = theme.occasion ?? greetingForHour(theme, hour);
  return template.replaceAll("{name}", name.trim() || "there");
}

function greetingForHour(theme: ThemeManifest, hour: number): string {
  if (hour >= 5 && hour < 12) return theme.greetings.morning;
  if (hour >= 12 && hour < 17) return theme.greetings.afternoon;
  if (hour >= 17 && hour < 22) return theme.greetings.evening;
  return theme.greetings.night;
}
