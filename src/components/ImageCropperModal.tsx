import { useState, useCallback } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react'

type ImageCropperModalProps = {
  isOpen: boolean
  onClose: () => void
  imageFile: File | null
  aspectRatio: number
  onSave: (croppedFile: File) => void | Promise<void>
  title?: string
}

async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  originalFile: File,
): Promise<File> {
  const image = await createImageBitmap(await fetch(imageSrc).then((r) => r.blob()))

  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No 2d context')

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.9)
  })

  if (!blob) throw new Error('Canvas is empty')

  return new File(
    [blob],
    `cropped_${originalFile.name.replace(/\.[^/.]+$/, '')}.webp`,
    { type: 'image/webp' },
  )
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageFile,
  aspectRatio,
  onSave,
  title = 'ครอบตัดรูปภาพ',
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const imageSrc = imageFile ? URL.createObjectURL(imageFile) : ''

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  async function handleSave() {
    if (!croppedAreaPixels || !imageFile || !imageSrc) return
    setIsSaving(true)
    try {
      const file = await getCroppedImage(imageSrc, croppedAreaPixels, imageFile)
      await onSave(file)
      onClose()
    } catch (err) {
      console.error('Failed to crop image', err)
      // Fallback: pass original file
      await onSave(imageFile)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !imageFile) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: 'min(760px, 94vw)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111827' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Crop area — fixed container, image pans inside */}
        <div style={{ position: 'relative', height: '360px', background: '#111' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={true}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: '2px solid rgba(255,255,255,0.9)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}
            aria-label="ซูมออก"
          >
            <ZoomOut size={18} />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#111827' }}
            aria-label="ซูม"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}
            aria-label="ซูมเข้า"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* Helper text + actions */}
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
            ลากรูปหรือเลื่อนสไลเดอร์เพื่อปรับตำแหน่ง — กรอบคงที่ตามสัดส่วนที่ล็อกไว้
          </p>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: '7px',
                border: '1px solid #d1d5db',
                background: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
              }}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !croppedAreaPixels}
              style={{
                padding: '8px 18px',
                borderRadius: '7px',
                background: isSaving || !croppedAreaPixels ? '#9ca3af' : '#111827',
                color: 'white',
                border: 'none',
                cursor: isSaving || !croppedAreaPixels ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <Check size={15} />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกรูปภาพ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
