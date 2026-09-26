(function attachDiaryCachePolicy(scope) {
  scope.DiaryCachePolicy = {
    shouldCache(request, url, origin) {
      if (request.method !== "GET") return false;
      if (url.origin !== origin) return false;
      if (request.mode === "navigate") return false;
      if (url.pathname.startsWith("/api/")) return false;

      return (
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.startsWith("/icons/") ||
        url.pathname.startsWith("/themes/") ||
        url.pathname === "/offline"
      );
    },
  };
})(self);
