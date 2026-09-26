/** Placeholder art: gradient, grain, and vignette from the active theme's tokens. */
export function ThemeArt() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="theme-wash absolute inset-0" />
      <div className="theme-grain absolute inset-0" />
      <div className="theme-vignette absolute inset-0" />
    </div>
  );
}
