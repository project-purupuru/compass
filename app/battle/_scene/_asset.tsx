"use client";

/**
 * ResilientImage — graceful image fallback. SDD §3.4.2.
 *
 * If src fails to load, swap to fallback OR null-render (with optional
 * CSS-only placeholder via className).
 */

import { useState } from "react";

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  readonly src: string;
  readonly alt: string;
  readonly fallback?: string;
}

export function ResilientImage({ src, alt, fallback, className, ...rest }: ResilientImageProps) {
  const [errored, setErrored] = useState(false);
  if (errored && !fallback) {
    return <div role="img" aria-label={alt} className={className} />;
  }
  return (
    <img
      src={errored && fallback ? fallback : src}
      alt={alt}
      onError={() => setErrored(true)}
      loading="lazy"
      className={className}
      {...rest}
    />
  );
}
