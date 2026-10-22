export const MAX_RETAIL_PHOTO_BYTES = 5 * 1024 * 1024;
export const RETAIL_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function retailPhotoError(file: File): string | null {
  if (!RETAIL_PHOTO_TYPES.includes(file.type)) return 'Choose a JPEG, PNG or WebP image.';
  if (!file.size) return 'That file is empty. Choose another image.';
  if (file.size > MAX_RETAIL_PHOTO_BYTES) return 'That image is too large. The limit is 5 MB.';
  return null;
}

/** Keep full-resolution camera photos off every student's menu download. */
export async function prepareRetailPhoto(file: File): Promise<File> {
  const error = retailPhotoError(file);
  if (error) throw new Error(error);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare the photo. Try again.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not prepare the photo.')), 'image/jpeg', 0.85),
    );
    return new File([blob], 'retail-photo.jpg', { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

