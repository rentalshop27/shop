import { useState, useRef, useEffect, type SyntheticEvent } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { X, Check } from 'lucide-react'
import { buildCenteredAspectCrop, createCroppedImageFile } from './imageCropperUtils'

type ImageCropperModalProps = {
  isOpen: boolean
  onClose: () => void
  imageFile: File | null
  aspectRatio: number
  onSave: (croppedFile: File) => void | Promise<void>
  title?: string
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageFile,
  aspectRatio,
  onSave,
  title = 'ครอบตัดรูปภาพ',
}: ImageCropperModalProps) {
  const [imgSrc, setImgSrc] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (imageFile) {
      setCrop(undefined)
      setCompletedCrop(undefined)
      setSaveError(null)
      const reader = new FileReader()
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''))
      reader.readAsDataURL(imageFile)
    } else {
      setImgSrc('')
      setCompletedCrop(undefined)
      setSaveError(null)
    }
  }, [imageFile])

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    setCompletedCrop(undefined)
    setCrop(buildCenteredAspectCrop(width, height, aspectRatio))
  }

  async function handleSave() {
    if (!completedCrop || completedCrop.width <= 0 || completedCrop.height <= 0 || !imgRef.current || !imageFile) {
      return
    }
    setIsSaving(true)
    setSaveError(null)

    try {
      const file = await createCroppedImageFile(imgRef.current, completedCrop, imageFile.name)
      await onSave(file)
      onClose()
    } catch (err) {
      console.error('Failed to crop image', err)
      setSaveError('ไม่สามารถครอบตัดและบันทึกรูปภาพได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setIsSaving(false)
    }
  }

  const isSaveDisabled = isSaving || !completedCrop || completedCrop.width <= 0 || completedCrop.height <= 0

  if (!isOpen || !imageFile) return null

  return (
    <div className="prc-modal-overlay" role="dialog" aria-modal="true" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="prc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
        <div className="prc-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{title}</h2>
          <button className="prc-modal-close" type="button" onClick={onClose} aria-label="ปิด" style={{ position: 'static' }}>
            <X size={20} />
          </button>
        </div>
        
        <div className="prc-modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '70vh', overflowY: 'auto' }}>
           {imgSrc && (
             <ReactCrop
               crop={crop}
               onChange={(_, percentCrop) => {
                 setCrop(percentCrop)
                 setSaveError(null)
               }}
               onComplete={(c) => setCompletedCrop(c)}
               aspect={aspectRatio}
               style={{ maxHeight: '60vh' }}
             >
               <img
                 ref={imgRef}
                 alt="Crop me"
                 src={imgSrc}
                 onLoad={onImageLoad}
                 style={{ maxHeight: '60vh', width: 'auto', maxWidth: '100%' }}
               />
             </ReactCrop>
           )}
           <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
             ใช้เมาส์ลากหรือขยับกรอบเพื่อเลือกส่วนของรูปภาพที่ต้องการ
           </p>
           {saveError && (
             <p role="alert" style={{ marginTop: '12px', fontSize: '14px', color: '#dc2626', textAlign: 'center' }}>
               {saveError}
             </p>
           )}
        </div>

        <div className="prc-modal-footer" style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
           <button type="button" className="prc-btn prc-btn-secondary" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white' }}>
             ยกเลิก
           </button>
           <button 
             type="button" 
             onClick={handleSave} 
             disabled={isSaveDisabled}
             style={{ 
               padding: '8px 16px', 
               borderRadius: '6px', 
               background: '#111827', 
               color: 'white', 
               border: 'none',
               display: 'flex',
               alignItems: 'center',
               gap: '8px',
               cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
               opacity: isSaveDisabled ? 0.7 : 1
             }}
           >
             <Check size={16} />
             {isSaving ? 'กำลังบันทึก...' : 'บันทึกรูปภาพ'}
           </button>
        </div>
      </div>
    </div>
  )
}
