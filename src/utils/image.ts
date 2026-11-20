export interface PreparedImage {
  analysisDataUrl: string;
  analysisBase64: string;
  mimeType: string;
  thumbnailDataUrl: string;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the selected image file.'));
    img.src = src;
  });
}

function renderScaledJpeg(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number
): string {
  const { naturalWidth, naturalHeight } = img;
  const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
  const targetWidth = Math.max(1, Math.round(naturalWidth * scale));
  const targetHeight = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL('image/jpeg', quality);
}

export async function prepareImageFromDataUrl(dataUrl: string): Promise<PreparedImage> {
  const img = await loadImageElement(dataUrl);
  const analysisDataUrl = renderScaledJpeg(img, 1280, 0.86);
  const thumbnailDataUrl = renderScaledJpeg(img, 420, 0.72);
  const analysisBase64 = analysisDataUrl.split(',')[1] || '';

  return {
    analysisDataUrl,
    analysisBase64,
    mimeType: 'image/jpeg',
    thumbnailDataUrl,
  };
}

export async function prepareImageFromFile(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, or WebP).');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(objectUrl);
    const analysisDataUrl = renderScaledJpeg(img, 1280, 0.86);
    const thumbnailDataUrl = renderScaledJpeg(img, 420, 0.72);
    const analysisBase64 = analysisDataUrl.split(',')[1] || '';

    return {
      analysisDataUrl,
      analysisBase64,
      mimeType: 'image/jpeg',
      thumbnailDataUrl,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
