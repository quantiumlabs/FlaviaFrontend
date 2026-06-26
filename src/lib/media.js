export function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  // Ensure the path starts with /uploads/
  let path = url;
  if (!path.startsWith("/uploads/") && !path.startsWith("uploads/")) {
    path = `/uploads/${path.startsWith("/") ? path.slice(1) : path}`;
  } else if (path.startsWith("uploads/")) {
    path = `/${path}`;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://ceusgame.com:5522";
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return `${cleanBaseUrl}${path}`;
}

export async function compressImage(file, maxWidth = 1600, quality = 0.8) {
  let imageFile = file;

  // 1. Convert HEIC/HEIF to JPEG
  if (/\.(heic|heif)$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif") {
    try {
      const heic2any = (await import("heic2any")).default;
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8,
      });
      const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      imageFile = new File([finalBlob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    } catch (e) {
      console.warn("Falha ao converter HEIC para JPEG:", e);
      // Fallback
      return file; 
    }
  }

  // 2. Compress via Canvas
  if (!imageFile.type.startsWith("image/")) return imageFile;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(
                new File([blob], imageFile.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }),
              );
            } else {
              resolve(imageFile);
            }
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => resolve(imageFile);
    };
    reader.onerror = () => resolve(imageFile);
  });
}
