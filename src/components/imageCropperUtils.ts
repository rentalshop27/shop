import { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'

const FULL_BOUNDS_CROP: Crop = {
  unit: '%',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
}

export function buildCenteredAspectCrop(mediaWidth: number, mediaHeight: number, aspectRatio: number): Crop {
  if (mediaWidth <= 0 || mediaHeight <= 0 || aspectRatio <= 0) {
    return { ...FULL_BOUNDS_CROP }
  }

  const imageAspectRatio = mediaWidth / mediaHeight
  const baseCrop =
    imageAspectRatio > aspectRatio
      ? { unit: '%' as const, height: 100 }
      : { unit: '%' as const, width: 100 }

  return centerCrop(
    makeAspectCrop(baseCrop, aspectRatio, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  )
}

export async function createCroppedImageFile(
  image: Pick<HTMLImageElement, 'naturalWidth' | 'naturalHeight' | 'width' | 'height'>,
  crop: Pick<PixelCrop, 'x' | 'y' | 'width' | 'height'>,
  originalFileName: string,
): Promise<File> {
  if (crop.width <= 0 || crop.height <= 0) {
    throw new Error('Crop dimensions invalid')
  }

  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  const pixelRatio = window.devicePixelRatio || 1
  canvas.width = crop.width * pixelRatio
  canvas.height = crop.height * pixelRatio
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(
    image as CanvasImageSource,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  )

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.9)
  })

  if (!blob) {
    throw new Error('Canvas is empty')
  }

  return new File([blob], `cropped_${originalFileName.replace(/\.[^/.]+$/, '')}.webp`, {
    type: 'image/webp',
  })
}
