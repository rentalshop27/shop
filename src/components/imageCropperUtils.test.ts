// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCenteredAspectCrop, createCroppedImageFile } from './imageCropperUtils'

describe('buildCenteredAspectCrop', () => {
  it('keeps a wide desktop source crop within bounds', () => {
    const crop = buildCenteredAspectCrop(4000, 1000, 1600 / 600)

    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThanOrEqual(0)
    expect(crop.width).toBeLessThanOrEqual(100)
    expect(crop.height).toBeLessThanOrEqual(100)
  })

  it('keeps a 16:9 source crop within bounds for the mobile ratio', () => {
    const crop = buildCenteredAspectCrop(1600, 900, 1080 / 720)

    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThanOrEqual(0)
    expect(crop.width).toBeLessThanOrEqual(100)
    expect(crop.height).toBeLessThanOrEqual(100)
  })
})

describe('createCroppedImageFile', () => {
  const originalCreateElement = document.createElement.bind(document)
  const originalDevicePixelRatio = window.devicePixelRatio

  beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 1,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: originalDevicePixelRatio,
    })
  })

  function mockCanvas(toBlobImpl: (callback: BlobCallback) => void) {
    const setTransform = vi.fn()
    const drawImage = vi.fn()
    const getContext = vi.fn(() => ({
      setTransform,
      drawImage,
      imageSmoothingQuality: 'high',
    }))

    const canvas = {
      width: 0,
      height: 0,
      getContext,
      toBlob: toBlobImpl,
    } as unknown as HTMLCanvasElement

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      if (tagName === 'canvas') {
        return canvas
      }
      return originalCreateElement(tagName, options)
    }) as typeof document.createElement)

    return { drawImage, getContext, setTransform }
  }

  it('creates a cropped webp file', async () => {
    const { drawImage } = mockCanvas((callback) => callback(new Blob(['cropped'], { type: 'image/webp' })))

    const file = await createCroppedImageFile(
      {
        naturalWidth: 1600,
        naturalHeight: 600,
        width: 400,
        height: 150,
      },
      { x: 0, y: 0, width: 200, height: 100 },
      'banner.png',
    )

    expect(drawImage).toHaveBeenCalledTimes(1)
    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe('cropped_banner.webp')
    expect(file.type).toBe('image/webp')
  })

  it('throws when canvas export fails so callers can fail closed', async () => {
    mockCanvas((callback) => callback(null))

    await expect(
      createCroppedImageFile(
        {
          naturalWidth: 1600,
          naturalHeight: 600,
          width: 400,
          height: 150,
        },
        { x: 0, y: 0, width: 200, height: 100 },
        'banner.png',
      ),
    ).rejects.toThrow('Canvas is empty')
  })
})
