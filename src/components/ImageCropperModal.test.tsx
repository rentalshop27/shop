// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImageCropperModal } from './ImageCropperModal'

vi.mock('react-easy-crop', () => ({
  default: ({ onCropComplete }: { onCropComplete: (area: unknown, pixels: unknown) => void }) => (
    <button type="button" onClick={() => onCropComplete({}, { x: 0, y: 0, width: 1600, height: 600 })}>
      Set crop
    </button>
  ),
}))

describe('ImageCropperModal', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('keeps the modal open and does not upload when crop export fails', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: async () => new Blob(['image']) }))
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('export failed')))
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:image') })

    render(
      <ImageCropperModal
        isOpen
        imageFile={new File(['image'], 'banner.png', { type: 'image/png' })}
        aspectRatio={1600 / 600}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Set crop' }))
    await user.click(screen.getByRole('button', { name: 'บันทึกรูปภาพ' }))

    expect((await screen.findByRole('alert')).textContent).toContain('ไม่สามารถครอบตัดรูปได้')
    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).not.toBeNull()
  })
})
