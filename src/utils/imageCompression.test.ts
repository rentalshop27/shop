// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compressImage, compressImageAsFile } from './imageCompression'

describe('imageCompression', () => {
  const originalCreateElement = document.createElement.bind(document)
  const originalFileReader = globalThis.FileReader
  const originalImage = globalThis.Image

  let mockImageWidth = 4000
  let mockImageHeight = 3000
  let bytesDivisor = 12

  class MockFileReader {
    result: string | ArrayBuffer | null = null
    error: DOMException | null = null
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null

    readAsDataURL(file: Blob) {
      const mimeType = file.type || 'application/octet-stream'
      this.result = `data:${mimeType};base64,AAAA`
      this.onload?.call(
        this as unknown as FileReader,
        new ProgressEvent('load') as ProgressEvent<FileReader>,
      )
    }
  }

  class MockImage {
    width = mockImageWidth
    height = mockImageHeight
    onload: (() => void) | null = null
    onerror: (() => void) | null = null

    set src(_value: string) {
      this.width = mockImageWidth
      this.height = mockImageHeight
      queueMicrotask(() => this.onload?.())
    }
  }

  beforeEach(() => {
    bytesDivisor = 12
    mockImageWidth = 4000
    mockImageHeight = 3000

    vi.restoreAllMocks()
    globalThis.FileReader = MockFileReader as unknown as typeof FileReader
    globalThis.Image = MockImage as unknown as typeof Image

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
      if (tagName !== 'canvas') {
        return originalCreateElement(tagName, options)
      }

      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({
          clearRect: vi.fn(),
          drawImage: vi.fn(),
        }),
        toDataURL: (mimeType = 'image/webp', quality = 1) => {
          const approximateBytes = Math.max(
            64,
            Math.round((canvas.width * canvas.height * Math.max(quality, 0.1)) / bytesDivisor),
          )
          const base64Length = Math.ceil((approximateBytes * 4) / 3)
          return `data:${mimeType};base64,${'a'.repeat(base64Length)}`
        },
      } as unknown as HTMLCanvasElement

      return canvas
    }) as typeof document.createElement)
  })

  afterEach(() => {
    globalThis.FileReader = originalFileReader
    globalThis.Image = originalImage
  })

  it('scales product images down to the product preset bounds', async () => {
    const file = new File(['product'], 'lookbook.png', { type: 'image/png' })

    const result = await compressImage(file, 'product')

    expect(result.width).toBeLessThanOrEqual(1280)
    expect(result.height).toBeLessThanOrEqual(1280)
    expect(result.file.type).toBe('image/webp')
    expect(result.file.name).toBe('lookbook.webp')
  })

  it('keeps desktop hero images above the configured minimum display size', async () => {
    bytesDivisor = 1
    mockImageWidth = 3200
    mockImageHeight = 1200

    const file = new File(['hero'], 'hero.png', { type: 'image/png' })
    const result = await compressImage(file, 'heroDesktop')

    expect(result.width).toBe(1600)
    expect(result.height).toBe(600)
    expect(result.sizeBytes).toBeGreaterThan(600 * 1024)
  })

  it('rejects hero images below the minimum display size instead of upscaling them', async () => {
    mockImageWidth = 800
    mockImageHeight = 300

    await expect(
      compressImage(new File(['hero'], 'hero.png', { type: 'image/png' }), 'heroDesktop'),
    ).rejects.toThrow('1600 x 600')
  })

  it('returns non-image files unchanged', async () => {
    const file = new File(['pdf'], 'customer-id.pdf', { type: 'application/pdf' })

    const result = await compressImageAsFile(file, 'customerDocument')

    expect(result).toBe(file)
  })
})
