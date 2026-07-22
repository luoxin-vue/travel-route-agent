/** 把高德图片改成走后端同源代理（https 图片如 Wikipedia 直出，不经过代理）。 */
export function proxiedImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("https://")) return url;
  return `/api/img?url=${encodeURIComponent(url)}`;
}
