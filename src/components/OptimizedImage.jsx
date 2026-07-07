import React, { useEffect, useMemo, useState } from "react";
import { getOptimizedImageProps, getOriginalImageUrl } from "../utils/images";

export default function OptimizedImage({
  src,
  alt = "",
  preset = "card",
  width,
  widths,
  sizes,
  quality,
  className = "",
  loading = "lazy",
  fetchPriority,
  fetchpriority,
  onLoad,
  onError,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const imageProps = useMemo(
    () =>
      getOptimizedImageProps(src, {
        preset,
        width,
        widths,
        sizes,
        quality,
        loading,
      }),
    [src, preset, width, widths, sizes, quality, loading]
  );

  useEffect(() => {
    setUseFallback(false);
    setLoaded(false);
  }, [src, imageProps.src]);

  if (!imageProps.src && !imageProps.fallbackSrc) return null;

  const activeSrc = useFallback
    ? imageProps.fallbackSrc || getOriginalImageUrl(src)
    : imageProps.src;

  const priority = fetchpriority ?? fetchPriority;
  const safeFetchPriority = loading === "eager" ? priority : undefined;

  return (
    <img
      {...rest}
      src={activeSrc}
      srcSet={useFallback ? undefined : imageProps.srcSet}
      sizes={useFallback ? undefined : imageProps.sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      {...(safeFetchPriority ? { fetchpriority: safeFetchPriority } : {})}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        const fallback = imageProps.fallbackSrc || getOriginalImageUrl(src);
        if (!useFallback && fallback && activeSrc !== fallback) {
          setUseFallback(true);
          setLoaded(false);
          return;
        }
        onError?.(event);
      }}
      className={`${className} ${loaded ? "img-loaded" : "img-loading"}`.trim()}
    />
  );
}