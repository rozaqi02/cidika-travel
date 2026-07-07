const DEFAULTS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.82,
  mimeType: "image/webp",
};

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca gambar"));
    };
    img.src = url;
  });
}

function getScaledSize(width, height, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export async function compressImage(file, options = {}) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("File bukan gambar");
  }

  const config = { ...DEFAULTS, ...options };
  const img = await loadImageFromFile(file);
  const { width, height } = getScaledSize(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    config.maxWidth,
    config.maxHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas tidak didukung");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Gagal mengompres gambar"));
          return;
        }
        resolve(result);
      },
      config.mimeType,
      config.quality
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  const ext = config.mimeType === "image/jpeg" ? "jpg" : "webp";
  const compressed = new File([blob], `${baseName}.${ext}`, {
    type: config.mimeType,
    lastModified: Date.now(),
  });

  return {
    file: compressed,
    width,
    height,
    originalSize: file.size,
    compressedSize: compressed.size,
  };
}

export async function prepareImageForUpload(file, path = "") {
  if (!file?.type?.startsWith("image/")) {
    return { file, path };
  }

  try {
    const { file: compressed } = await compressImage(file);
    const nextPath = path.replace(/\.[^.]+$/, ".webp");
    return { file: compressed, path: nextPath };
  } catch {
    return { file, path };
  }
}