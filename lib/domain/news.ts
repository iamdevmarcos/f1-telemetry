export function slugifyTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildNewsSlug(title: string, sourceKey: string): string {
  const base = slugifyTitle(title) || "article";
  const suffix = sourceKey
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);
  return suffix ? `${base}-${suffix}` : base;
}
