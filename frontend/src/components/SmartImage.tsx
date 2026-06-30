import { useState } from "react";
import { proxiedImage } from "../lib/img";

/** 加载失败/无地址时自动隐藏，避免高德图片偶发 403 导致破图。
 *  默认走后端图片代理（同源 https）；传 raw 可关闭。 */
export function SmartImage({
  src,
  alt = "",
  className = "",
  raw = false,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  raw?: boolean;
}) {
  const [ok, setOk] = useState(true);
  const finalSrc = raw ? src ?? undefined : proxiedImage(src);
  if (!finalSrc || !ok) return null;
  return (
    <img
      src={finalSrc}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setOk(false)}
      className={className}
    />
  );
}
