import heic2any from "heic2any";

const IMG_MAX_DIM = 1600;
const IMG_QUALITY = 0.8;

/**
 * Convert HEIC/HEIF files to JPEG blob, pass through others unchanged.
 */
export async function normalizeImageFile(file) {
  const name = file.name.toLowerCase();
  const isHeic =
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    file.type === "image/heic" ||
    file.type === "image/heif";

  if (isHeic) {
    try {
      const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
      // heic2any can return an array of blobs for multi-frame, take the first
      const result = Array.isArray(blob) ? blob[0] : blob;
      return new File([result], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    } catch (err) {
      console.error("HEIC conversion failed:", err);
      throw new Error("Could not process this image format. Try converting it to JPEG first.");
    }
  }
  return file;
}

/**
 * Compress an image file using canvas. Handles HEIC conversion first.
 * Returns a compressed JPEG File.
 */
export async function compressImage(file) {
  // Step 1: normalize HEIC → JPEG
  const normalized = await normalizeImageFile(file);

  // Step 2: compress via canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(normalized);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > IMG_MAX_DIM || height > IMG_MAX_DIM) {
        const ratio = Math.min(IMG_MAX_DIM / width, IMG_MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image compression failed — unsupported format."));
            return;
          }
          resolve(
            new File([blob], normalized.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
          );
        },
        "image/jpeg",
        IMG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image — the file may be corrupted or unsupported."));
    };

    img.src = url;
  });
}
