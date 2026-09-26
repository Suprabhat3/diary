/**
 * Placeholder art is the gradient, grain, and vignette.
 * Drop illustrated files in `public/themes/<theme-id>/` and they show on the
 * next request, with no code change:
 *   bg-light.avif, bg-dark.avif, and optional .webp fallbacks of the same names.
 */
export function ThemeArt({
  lightAvif,
  darkAvif,
  lightWebp,
  darkWebp,
  priority = false,
}: {
  lightAvif: string | null;
  darkAvif: string | null;
  lightWebp: string | null;
  darkWebp: string | null;
  priority?: boolean;
}) {
  const light = lightAvif ?? lightWebp;
  const hasArt = light !== null || darkAvif !== null || darkWebp !== null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="theme-wash absolute inset-0" />
      {hasArt ? (
        <picture>
          {darkAvif ? (
            <source media="(prefers-color-scheme: dark)" srcSet={darkAvif} type="image/avif" />
          ) : null}
          {darkWebp ? (
            <source media="(prefers-color-scheme: dark)" srcSet={darkWebp} type="image/webp" />
          ) : null}
          {lightAvif ? <source srcSet={lightAvif} type="image/avif" /> : null}
          {light ? (
            // Full-bleed seasonal art. next/image needs known dimensions; these files arrive later at any size.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={light}
              alt=""
              fetchPriority={priority ? "high" : "low"}
              className="theme-photo absolute inset-0 size-full object-cover"
            />
          ) : null}
        </picture>
      ) : null}
      <div className="theme-grain absolute inset-0" />
      <div className="theme-vignette absolute inset-0" />
    </div>
  );
}
