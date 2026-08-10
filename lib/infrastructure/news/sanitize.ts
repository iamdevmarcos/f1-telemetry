import "server-only";

import DOMPurify from "isomorphic-dompurify";

export function sanitizeNewsHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel", "loading"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
  });
}
