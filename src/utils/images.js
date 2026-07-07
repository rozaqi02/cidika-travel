const SUPABASE_OBJECT_RE =
  /^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i;
const SUPABASE_RENDER_RE =
  /^https?:\/\/[^/]+\/storage\/v1\/render\/image\/public\//i;

export const IMAGE_PRESETS = {
  hero: {
    width: 1920,
    widths: [640, 960, 1280, 1920],
    sizes: "100vw",
    quality: 78,
  },
  detail: {
    width: 1280,
    widths: [640, 960, 1280],
    sizes: "100vw",
    quality: 82,
  },
  card: {
    width: 640,
    widths: [320, 480, 640],
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px",
    quality: 80,
  },
  gallery: {
    width: 800,
    widths: [400, 600, 800],
    sizes: "(max-width: 768px) 50vw, 25vw",
    quality: 78,
  },
  galleryLarge: {
    width: 1200,
    widths: [600, 900, 1200],
    sizes: "(max-width: 768px) 100vw, 50vw",
    quality: 80,
  },
  thumb: {
    width: 320,
    widths: [160, 240, 320],
    sizes: "160px",
    quality: 75,
  },
};

export function normalizeImageUrl(raw) {
  if (!raw) return "";
  const value = String(raw).trim();
  if (/^https?:\/\//i.test(value)) return value;
  return value.startsWith("/") ? value : `/${value}`;
}

export function isSupabaseStorageUrl(url) {
  return SUPABASE_OBJECT_RE.test(url) || SUPABASE_RENDER_RE.test(url);
}

export function isImageTransformEnabled() {
  return process.env.REACT_APP_IMAGE_TRANSFORM === "true";
}

export function getOriginalImageUrl(src) {
  const normalized = normalizeImageUrl(src);
  if (!normalized) return "";

  const renderMatch = normalized.match(
    /^(https?:\/\/[^/]+)\/storage\/v1\/render\/image\/public\/([^/]+)\/(.+?)(?:\?.*)?$/i
  );
  if (renderMatch) {
    const [, base, bucket, path] = renderMatch;
    return `${base}/storage/v1/object/public/${bucket}/${path}`;
  }

  return normalized;
}

export function optimizeImageUrl(
  src,
  { width, height, quality = 80, format = "webp", resize = "cover" } = {}
) {
  const normalized = getOriginalImageUrl(src);
  if (!normalized) return "";

  if (!isImageTransformEnabled()) return normalized;

  const match = normalized.match(SUPABASE_OBJECT_RE);
  if (!match) return normalized;

  const [, base, bucket, path] = match;
  const params = new URLSearchParams();
  if (width) params.set("width", String(Math.round(width)));
  if (height) params.set("height", String(Math.round(height)));
  params.set("quality", String(quality));
  params.set("resize", resize);
  if (format && format !== "origin") params.set("format", format);

  return `${base}/storage/v1/render/image/public/${bucket}/${path}?${params}`;
}

export function buildSrcSet(src, widths = [], options = {}) {
  const normalized = normalizeImageUrl(src);
  if (!normalized || !isSupabaseStorageUrl(normalized)) return "";

  return widths
    .map((width) => {
      const url = optimizeImageUrl(normalized, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(", ");
}

export function getOptimizedImageProps(
  src,
  { preset = "card", width, widths, sizes, quality, loading = "lazy" } = {}
) {
  const normalized = normalizeImageUrl(src);
  if (!normalized) {
    return { src: "", srcSet: undefined, sizes: undefined, loading };
  }

  const presetConfig = IMAGE_PRESETS[preset] || IMAGE_PRESETS.card;
  const targetWidth = width || presetConfig.width;
  const targetWidths = widths || presetConfig.widths;
  const targetSizes = sizes || presetConfig.sizes;
  const targetQuality = quality ?? presetConfig.quality;

  const optimizedSrc = optimizeImageUrl(normalized, {
    width: targetWidth,
    quality: targetQuality,
  });
  const srcSet = buildSrcSet(normalized, targetWidths, { quality: targetQuality });

  return {
    src: optimizedSrc,
    fallbackSrc: normalized,
    srcSet: isImageTransformEnabled() && srcSet ? srcSet : undefined,
    sizes: isImageTransformEnabled() && srcSet ? targetSizes : undefined,
    loading,
  };
}

export function getPkgImage(pkg) {
  const raw =
    pkg?.default_image ||
    pkg?.cover_url ||
    pkg?.thumbnail ||
    pkg?.thumb_url ||
    pkg?.image_url ||
    (Array.isArray(pkg?.images) && pkg.images[0]) ||
    (pkg?.data?.images && pkg.data.images[0]) ||
    "";
  const url = normalizeImageUrl(raw);
  return url || "/23.jpg";
}

const preloadCache = new Set();

export function preloadImage(src, options = {}) {
  const normalized = normalizeImageUrl(src);
  if (!normalized || preloadCache.has(normalized)) return Promise.resolve();

  const { width = 1280, quality = 78 } = options;
  const url = optimizeImageUrl(normalized, { width, quality }) || normalized;

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      preloadCache.add(normalized);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

export function getSupabaseOrigin() {
  const raw = process.env.REACT_APP_SUPABASE_URL?.trim();
  if (!raw) return null;
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}.supabase.co`;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}