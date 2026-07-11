type ImageCompressionOptions = {
  maxWidth: number
  maxHeight: number
  targetMaxBytes?: number
  initialQuality?: number
  minQuality?: number
  qualityStep?: number
  scaleStep?: number
  minWidth?: number
  minHeight?: number
  mimeType?: string
}

type ImageCompressionResult = {
  dataUrl: string
  file: File
  width: number
  height: number
  sizeBytes: number
}

type ResolvedImageCompressionOptions = Required<
  Pick<ImageCompressionOptions, 'initialQuality' | 'minQuality' | 'qualityStep' | 'scaleStep' | 'mimeType'>
> &
  Pick<
    ImageCompressionOptions,
    'maxWidth' | 'maxHeight' | 'targetMaxBytes' | 'minWidth' | 'minHeight'
  >

export const IMAGE_COMPRESSION_PRESETS = {
  product: {
    maxWidth: 1280,
    maxHeight: 1280,
    targetMaxBytes: 250 * 1024,
    initialQuality: 0.82,
    minQuality: 0.55,
    qualityStep: 0.07,
    scaleStep: 0.9,
    mimeType: 'image/webp',
  },
  customerDocument: {
    maxWidth: 1920,
    maxHeight: 1920,
    targetMaxBytes: 500 * 1024,
    initialQuality: 0.88,
    minQuality: 0.65,
    qualityStep: 0.05,
    scaleStep: 0.92,
    mimeType: 'image/webp',
  },
  heroDesktop: {
    maxWidth: 1920,
    maxHeight: 720,
    minWidth: 1600,
    minHeight: 600,
    targetMaxBytes: 600 * 1024,
    initialQuality: 0.86,
    minQuality: 0.68,
    qualityStep: 0.04,
    scaleStep: 0.94,
    mimeType: 'image/webp',
  },
  heroMobile: {
    maxWidth: 1080,
    maxHeight: 720,
    minWidth: 1080,
    minHeight: 720,
    targetMaxBytes: 350 * 1024,
    initialQuality: 0.86,
    minQuality: 0.68,
    qualityStep: 0.04,
    scaleStep: 0.94,
    mimeType: 'image/webp',
  },
} satisfies Record<string, ImageCompressionOptions>

export type ImageCompressionPreset = keyof typeof IMAGE_COMPRESSION_PRESETS

const DEFAULT_PRESET: ImageCompressionPreset = 'product'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error(`ไม่สามารถอ่านไฟล์ ${file.name} ได้`))
    }
    reader.onerror = () => reject(reader.error ?? new Error(`ไม่สามารถอ่านไฟล์ ${file.name} ได้`))
    reader.readAsDataURL(file)
  })
}

function resolveOptions(
  presetOrOptions: ImageCompressionPreset | ImageCompressionOptions = DEFAULT_PRESET,
): ResolvedImageCompressionOptions {
  const baseOptions: ImageCompressionOptions =
    typeof presetOrOptions === 'string'
      ? IMAGE_COMPRESSION_PRESETS[presetOrOptions]
      : presetOrOptions

  return {
    ...baseOptions,
    initialQuality: baseOptions.initialQuality ?? 0.82,
    minQuality: baseOptions.minQuality ?? 0.55,
    qualityStep: baseOptions.qualityStep ?? 0.07,
    scaleStep: baseOptions.scaleStep ?? 0.9,
    mimeType: baseOptions.mimeType ?? 'image/webp',
    minWidth: baseOptions.minWidth,
    minHeight: baseOptions.minHeight,
  }
}

function replaceFileExtension(filename: string, mimeType: string) {
  const extension = mimeType === 'image/webp' ? 'webp' : mimeType.split('/')[1] || 'img'
  return `${filename.replace(/\.[^/.]+$/, '')}.${extension}`
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.ceil((base64.length * 3) / 4)
}

function scaleDimensions(width: number, height: number, maxWidth: number, maxHeight: number) {
  const widthRatio = maxWidth > 0 ? maxWidth / width : 1
  const heightRatio = maxHeight > 0 ? maxHeight / height : 1
  const ratio = Math.min(widthRatio, heightRatio, 1)

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพเพื่อบีบอัดได้'))
    image.src = source
  })
}

function dataUrlToBlob(dataUrl: string, mimeType: string) {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

async function dataUrlToFile(dataUrl: string, originalFileName: string, mimeType: string) {
  const blob = dataUrlToBlob(dataUrl, mimeType)
  return new File([blob], replaceFileExtension(originalFileName, mimeType), {
    type: mimeType,
    lastModified: Date.now(),
  })
}

async function compressImageInternal(
  file: File,
  presetOrOptions: ImageCompressionPreset | ImageCompressionOptions = DEFAULT_PRESET,
): Promise<ImageCompressionResult> {
  if (!file.type.startsWith('image/')) {
    const dataUrl = await readFileAsDataUrl(file)
    return {
      dataUrl,
      file,
      width: 0,
      height: 0,
      sizeBytes: file.size,
    }
  }

  const options = resolveOptions(presetOrOptions)
  const sourceUrl = await readFileAsDataUrl(file)
  const image = await loadImage(sourceUrl)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Failed to get canvas context')
  }

  const initialDimensions = scaleDimensions(
    image.width,
    image.height,
    options.maxWidth,
    options.maxHeight,
  )

  if (
    (options.minWidth && initialDimensions.width < options.minWidth) ||
    (options.minHeight && initialDimensions.height < options.minHeight)
  ) {
    throw new Error(
      `รูปภาพต้องมีขนาดอย่างน้อย ${options.minWidth ?? 1} x ${options.minHeight ?? 1} px`,
    )
  }

  const minWidth = options.minWidth ?? 1
  const minHeight = options.minHeight ?? 1

  let currentWidth = initialDimensions.width
  let currentHeight = initialDimensions.height
  let bestResult: Omit<ImageCompressionResult, 'file'> | null = null

  while (true) {
    canvas.width = currentWidth
    canvas.height = currentHeight
    context.clearRect(0, 0, currentWidth, currentHeight)
    context.drawImage(image, 0, 0, currentWidth, currentHeight)

    let quality = options.initialQuality
    let dataUrl = canvas.toDataURL(options.mimeType, quality)
    let sizeBytes = estimateDataUrlBytes(dataUrl)
    let bestAtCurrentScale = { dataUrl, sizeBytes, width: currentWidth, height: currentHeight }

    while (sizeBytes > (options.targetMaxBytes ?? Number.POSITIVE_INFINITY) && quality - options.qualityStep >= options.minQuality) {
      quality = Number((quality - options.qualityStep).toFixed(4))
      dataUrl = canvas.toDataURL(options.mimeType, quality)
      sizeBytes = estimateDataUrlBytes(dataUrl)
      bestAtCurrentScale = { dataUrl, sizeBytes, width: currentWidth, height: currentHeight }
    }

    if (!bestResult || bestAtCurrentScale.sizeBytes < bestResult.sizeBytes) {
      bestResult = bestAtCurrentScale
    }

    if (!options.targetMaxBytes || bestAtCurrentScale.sizeBytes <= options.targetMaxBytes) {
      bestResult = bestAtCurrentScale
      break
    }

    const nextWidth = Math.max(minWidth, Math.round(currentWidth * options.scaleStep))
    const nextHeight = Math.max(minHeight, Math.round(currentHeight * options.scaleStep))

    if (nextWidth === currentWidth && nextHeight === currentHeight) {
      break
    }

    currentWidth = nextWidth
    currentHeight = nextHeight
  }

  if (!bestResult) {
    throw new Error('ไม่สามารถบีบอัดรูปภาพได้')
  }

  return {
    ...bestResult,
    file: await dataUrlToFile(bestResult.dataUrl, file.name, options.mimeType),
  }
}

export async function compressImage(
  file: File,
  presetOrOptions: ImageCompressionPreset | ImageCompressionOptions = DEFAULT_PRESET,
): Promise<ImageCompressionResult> {
  return compressImageInternal(file, presetOrOptions)
}

export async function compressImageAsDataUrl(
  file: File,
  presetOrOptions: ImageCompressionPreset | ImageCompressionOptions = DEFAULT_PRESET,
): Promise<string> {
  const compressed = await compressImageInternal(file, presetOrOptions)
  return compressed.dataUrl
}

export async function compressImageAsFile(
  file: File,
  presetOrOptions: ImageCompressionPreset | ImageCompressionOptions = DEFAULT_PRESET,
): Promise<File> {
  const compressed = await compressImageInternal(file, presetOrOptions)
  return compressed.file
}
