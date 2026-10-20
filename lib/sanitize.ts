/**
 * Client-side SVG and HTML sanitizer
 * Removes XSS execution vectors, scripts, foreign objects, and event handlers
 * while preserving legitimate SVG paths, shapes, gradients, and styling.
 */
export function sanitizeSvg(svgContent: string): string {
  if (!svgContent || typeof svgContent !== "string") return "";

  const trimmed = svgContent.trim();
  if (!trimmed.toLowerCase().startsWith("<svg")) {
    return "";
  }

  // 1. Strip script tags entirely
  let clean = trimmed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, "");

  // 2. Strip dangerous embedded elements
  clean = clean.replace(/<\/?(foreignObject|iframe|object|embed|applet|meta|link|base)[^>]*>/gi, "");

  // 3. Strip all inline JavaScript event handlers (e.g. onload, onerror, onclick, onmouseover, etc.)
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, "");

  // 4. Strip dangerous URI schemes in href / xlink:href / src attributes
  clean = clean.replace(/\s+(?:xlink:)?href\s*=\s*['"]\s*(?:javascript|data:(?:text\/html|application\/javascript))[^'"]*['"]/gi, "");
  clean = clean.replace(/\s+src\s*=\s*['"]\s*(?:javascript|data:(?:text\/html|application\/javascript))[^'"]*['"]/gi, "");

  return clean;
}
