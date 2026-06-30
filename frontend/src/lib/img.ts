/** 把高德图片地址改成走后端同源代理：解决 http 混合内容 + 防盗链。 */
export function proxiedImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  return `/api/img?url=${encodeURIComponent(url)}`;
}
