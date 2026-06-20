import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction, ComponentProps } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { InventoryPage } from './InventoryPage'
import {
  countRemoteRentalsForStockSku,
  createRemoteStockItem,
  createRemoteStockItems,
  deleteRemoteStockItem,
  loadStockItems,
  updateRemoteStockItem,
  updateRemoteStockItemStatus,
} from './stockRemote'
import type { StockDraft, StockItem, StockItemStatus } from './inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

const emptyStockDraft: StockDraft = {
  sku: '',
  serialNumber: '',
  productName: '',
  brand: '',
  category: '',
  size: 'M',
  primaryColor: 'น้ำเงินมิดไนต์',
  publicDescription: '',
  setCount: '1',
  rentalPricePerDay: '',
  lateFeeRule: '',
  depositAmount: '',
  imageUrls: [],
  status: 'available',
}

type InventoryControllerOptions = {
  stockItems: StockItem[]
  setStockItems: Dispatch<SetStateAction<StockItem[]>>
  rentals: RentalOrder[]
  brands: string[]
  categories: string[]
  colors: string[]
  isSaving: boolean
  setIsSaving: Dispatch<SetStateAction<boolean>>
  isAuthenticated: boolean
  shopId: string | null
  supabase: SupabaseClient | null
  onLoadAuditLogs: () => Promise<void> | void
}

type NormalizedStockDraft = Omit<StockItem, 'id' | 'createdAt'>

export function useInventoryController({
  stockItems,
  setStockItems,
  rentals,
  brands,
  categories,
  colors,
  isSaving,
  setIsSaving,
  isAuthenticated,
  shopId,
  supabase,
  onLoadAuditLogs,
}: InventoryControllerOptions) {
  const [query, setQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [previewStockId, setPreviewStockId] = useState<string | null>(null)
  const [previewImageIndex, setPreviewImageIndex] = useState(0)
  const [draft, setDraft] = useState<StockDraft>(emptyStockDraft)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setQuery('')
    setIsFormOpen(false)
    setEditingStockId(null)
    setPreviewStockId(null)
    setPreviewImageIndex(0)
    setDraft(emptyStockDraft)
    setFormError('')
  }, [isAuthenticated, shopId])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return stockItems.filter((item) => {
      const searchable = [
        item.sku,
        item.serialNumber,
        item.productName,
        item.brand,
        item.category,
        item.size,
        item.primaryColor,
      ]
        .join(' ')
        .toLowerCase()

      return !normalizedQuery || searchable.includes(normalizedQuery)
    })
  }, [stockItems, query])

  const summary = useMemo(
    () => ({
      total: stockItems.length,
      sets: stockItems.reduce((total, item) => total + item.setCount, 0),
      deposits: stockItems.reduce((total, item) => total + item.depositAmount, 0),
      priced: stockItems.filter((item) => item.rentalPricePerDay > 0).length,
    }),
    [stockItems],
  )

  const previewItem = useMemo(() => {
    if (!previewStockId) return null
    return stockItems.find((item) => item.id === previewStockId) ?? null
  }, [previewStockId, stockItems])

  function updateDraft(field: keyof StockDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function openCreateForm() {
    setEditingStockId(null)
    setDraft(emptyStockDraft)
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(item: StockItem) {
    setEditingStockId(item.id)
    setDraft(toEditableStockDraft(item))
    setFormError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingStockId(null)
    setFormError('')
  }

  async function addImages(files: FileList | null) {
    if (!files?.length) return

    const incomingFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    const remainingSlots = 5 - draft.imageUrls.length

    if (remainingSlots <= 0) {
      window.alert('รูปชุดเต็ม 5 รูปแล้ว')
      return
    }

    const filesToUpload = incomingFiles.slice(0, remainingSlots)
    if (incomingFiles.length > remainingSlots) {
      window.alert(`สามารถเพิ่มรูปชุดได้อีกเพียง ${remainingSlots} รูป ระบบจะทำการเลือกเฉพาะ ${remainingSlots} รูปแรก`)
    }

    const imageUrls = await Promise.all(filesToUpload.map((file) => readFileAsDataUrl(file)))

    setDraft((current) => ({
      ...current,
      imageUrls: [...current.imageUrls, ...imageUrls],
    }))
  }

  function removeImage(imageUrl: string) {
    setDraft((current) => ({
      ...current,
      imageUrls: current.imageUrls.filter((url) => url !== imageUrl),
    }))
  }

  function openPreview(item: StockItem, index = 0) {
    if (!item.imageUrls.length) return
    setPreviewStockId(item.id)
    setPreviewImageIndex(index)
  }

  function closePreview() {
    setPreviewStockId(null)
    setPreviewImageIndex(0)
  }

  async function handleDelete(item: StockItem) {
    try {
      let relatedRentalCount = rentals.filter(
        (rental) => rental.costume.id === item.id || rental.costume.sku === item.sku,
      ).length

      if (supabase && isAuthenticated) {
        if (!shopId) {
          window.alert('ยังไม่พบร้านสำหรับบัญชีนี้')
          return
        }

        relatedRentalCount = await countRemoteRentalsForStockSku(supabase, shopId, item.sku)
      }

      if (relatedRentalCount > 0) {
        window.alert(`ยังลบชุด ${item.sku} ไม่ได้ เพราะมีใบเช่าที่อ้างอิงชุดนี้อยู่ ${relatedRentalCount} รายการ`)
        return
      }
    } catch (error) {
      window.alert(getErrorMessage(error))
      return
    }

    const confirmed = window.confirm(
      `คุณต้องการลบชุด "${item.productName}" (${item.sku}) ใช่หรือไม่?\n\nข้อมูลชุดและรูปภาพของชุดนี้จะถูกลบออกจากระบบ`,
    )
    if (!confirmed) return

    setFormError('')
    setIsSaving(true)

    try {
      if (supabase && isAuthenticated) {
        if (!shopId) {
          window.alert('ยังไม่พบร้านสำหรับบัญชีนี้')
          return
        }

        await deleteRemoteStockItem(supabase, shopId, item.id, item.imageUrls)
        await onLoadAuditLogs()
      }

      setStockItems((current) => current.filter((stockItem) => stockItem.id !== item.id))

      if (editingStockId === item.id) {
        closeForm()
      }

      if (previewStockId === item.id) {
        closePreview()
      }
    } catch (error) {
      window.alert(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateStatus(itemId: string, newStatus: StockItemStatus) {
    try {
      if (supabase && isAuthenticated) {
        if (!shopId) {
          window.alert('ยังไม่พบร้านสำหรับบัญชีนี้')
          return
        }

        await updateRemoteStockItemStatus(supabase, shopId, itemId, newStatus)
        await onLoadAuditLogs()
      }

      setStockItems((current) =>
        current.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)),
      )
    } catch (error) {
      window.alert(getErrorMessage(error))
    }
  }

  async function handleSave() {
    setFormError('')

    const normalizedDraft = normalizeStockDraft(draft)

    if (!normalizedDraft.sku) {
      setFormError('กรุณากรอก SKU/รหัสสต๊อก')
      return
    }

    const setCount = Number(draft.setCount)
    if (!Number.isInteger(setCount) || setCount < 1) {
      setFormError('จำนวนชุดต้องเป็นตัวเลขตั้งแต่ 1 ขึ้นไป')
      return
    }

    if (!normalizedDraft.productName) {
      setFormError('กรุณากรอกชื่อสินค้า')
      return
    }

    let baseSku = normalizedDraft.sku
    const suffixRegex = /-(\d{2,})$/
    if (!editingStockId && setCount > 1) {
      const match = baseSku.match(suffixRegex)
      if (match) {
        baseSku = baseSku.replace(suffixRegex, '')
      }
    }

    let baseSerial = normalizedDraft.serialNumber
    if (!editingStockId && setCount > 1 && baseSerial) {
      const match = baseSerial.match(suffixRegex)
      if (match) {
        baseSerial = baseSerial.replace(suffixRegex, '')
      }
    }

    const existingItem = editingStockId ? stockItems.find((item) => item.id === editingStockId) : undefined

    if (editingStockId) {
      if (
        stockItems.some(
          (item) =>
            item.id !== editingStockId && item.sku.toLowerCase() === normalizedDraft.sku.toLowerCase(),
        )
      ) {
        setFormError('SKU/รหัสสต๊อกนี้มีอยู่แล้ว')
        return
      }

      if (existingItem && existingItem.sku !== normalizedDraft.sku) {
        let relatedRentalCount: number

        try {
          relatedRentalCount =
            supabase && isAuthenticated && shopId
              ? await countRemoteRentalsForStockSku(supabase, shopId, existingItem.sku)
              : rentals.filter(
                  (rental) =>
                    rental.costume.id === existingItem.id || rental.costume.sku === existingItem.sku,
                ).length
        } catch (error) {
          setFormError(getErrorMessage(error))
          return
        }

        if (relatedRentalCount > 0) {
          setFormError(
            `แก้ไข SKU ของชุด ${existingItem.sku} ไม่ได้ เพราะมีใบเช่าที่อ้างอิงชุดนี้อยู่ ${relatedRentalCount} รายการ`,
          )
          return
        }
      }
    } else if (setCount > 1) {
      const duplicatedSkus: string[] = []

      for (let i = 1; i <= setCount; i++) {
        const suffix = String(i).padStart(2, '0')
        const itemSku = `${baseSku}-${suffix}`

        if (stockItems.some((item) => item.sku.toLowerCase() === itemSku.toLowerCase())) {
          duplicatedSkus.push(itemSku)
        }
      }

      if (duplicatedSkus.length > 0) {
        setFormError(`SKU ต่อไปนี้มีอยู่ในระบบแล้ว: ${duplicatedSkus.join(', ')}`)
        return
      }
    } else if (stockItems.some((item) => item.sku.toLowerCase() === normalizedDraft.sku.toLowerCase())) {
      setFormError('SKU/รหัสสต๊อกนี้มีอยู่แล้ว')
      return
    }

    setIsSaving(true)

    try {
      if (supabase && isAuthenticated) {
        if (!shopId) {
          setFormError('ยังไม่พบร้านสำหรับบัญชีนี้')
          return
        }

        if (editingStockId) {
          const savedItem = await updateRemoteStockItem(
            supabase,
            shopId,
            editingStockId,
            { ...normalizedDraft, setCount },
            existingItem?.imageUrls ?? [],
          )

          setStockItems((current) => current.map((item) => (item.id === editingStockId ? savedItem : item)))
        } else if (setCount > 1) {
          const itemDrafts = Array.from({ length: setCount }, (_, index) => {
            const suffix = String(index + 1).padStart(2, '0')

            return {
              ...normalizedDraft,
              sku: `${baseSku}-${suffix}`,
              serialNumber: baseSerial ? `${baseSerial}-${suffix}` : '',
              setCount: 1,
            }
          })

          await createRemoteStockItems(supabase, shopId, itemDrafts)
          const loadedStock = await loadStockItems(supabase, shopId)
          setStockItems(loadedStock)
        } else {
          const savedItem = await createRemoteStockItem(supabase, shopId, {
            ...normalizedDraft,
            setCount: 1,
          })

          setStockItems((current) => [savedItem, ...current])
        }

        await onLoadAuditLogs()
        closeForm()
      } else if (editingStockId) {
        const savedItem: StockItem = {
          ...normalizedDraft,
          setCount,
          id: editingStockId,
          createdAt: existingItem?.createdAt ?? new Date().toISOString(),
        }

        setStockItems((current) => current.map((item) => (item.id === editingStockId ? savedItem : item)))
        closeForm()
      } else {
        const savedItems =
          setCount > 1
            ? Array.from({ length: setCount }, (_, index) => {
                const suffix = String(index + 1).padStart(2, '0')

                return {
                  ...normalizedDraft,
                  sku: `${baseSku}-${suffix}`,
                  serialNumber: baseSerial ? `${baseSerial}-${suffix}` : '',
                  setCount: 1,
                  id: crypto.randomUUID(),
                  createdAt: new Date().toISOString(),
                }
              })
            : [
                {
                  ...normalizedDraft,
                  setCount: 1,
                  id: crypto.randomUUID(),
                  createdAt: new Date().toISOString(),
                },
              ]

        setStockItems((current) => [...savedItems, ...current])
        closeForm()
      }
    } catch (error) {
      if (supabase && isAuthenticated && shopId) {
        try {
          const loadedStock = await loadStockItems(supabase, shopId)
          setStockItems(loadedStock)
        } catch (reloadError) {
          console.warn('Failed to reload stock after save error:', reloadError)
        }
      }

      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const pageProps: ComponentProps<typeof InventoryPage> = {
    items: filteredItems,
    query,
    setQuery,
    summary,
    isFormOpen,
    isEditing: Boolean(editingStockId),
    draft,
    formError,
    isSaving,
    onOpenForm: openCreateForm,
    onCloseForm: closeForm,
    onEdit: openEditForm,
    onDelete: handleDelete,
    onPreview: openPreview,
    onDraftChange: updateDraft,
    onResetDraft: () => setDraft(emptyStockDraft),
    onImageUpload: addImages,
    onImageRemove: removeImage,
    onSave: handleSave,
    previewItem,
    previewImageIndex,
    onPreviewIndexChange: setPreviewImageIndex,
    onClosePreview: closePreview,
    brands,
    categories,
    colors,
    rentals,
    onUpdateStatus: handleUpdateStatus,
  }

  return { pageProps }
}

function toEditableStockDraft(item: StockItem): StockDraft {
  return {
    sku: item.sku,
    serialNumber: item.serialNumber,
    productName: item.productName,
    brand: item.brand,
    category: item.category,
    size: item.size,
    primaryColor: item.primaryColor,
    publicDescription: item.publicDescription,
    setCount: String(item.setCount),
    rentalPricePerDay: item.rentalPricePerDay ? String(item.rentalPricePerDay) : '',
    lateFeeRule: item.lateFeeRule,
    depositAmount: item.depositAmount ? String(item.depositAmount) : '',
    imageUrls: item.imageUrls ?? [],
    status: item.status || 'available',
  }
}

function normalizeStockDraft(draft: StockDraft): NormalizedStockDraft {
  return {
    sku: draft.sku.trim(),
    serialNumber: draft.serialNumber.trim(),
    productName: draft.productName.trim(),
    brand: draft.brand.trim(),
    category: draft.category.trim(),
    size: draft.size.trim(),
    primaryColor: draft.primaryColor.trim(),
    publicDescription: draft.publicDescription.trim(),
    setCount: 1,
    rentalPricePerDay: parseOptionalNumber(draft.rentalPricePerDay) ?? 0,
    lateFeeRule: draft.lateFeeRule.trim(),
    depositAmount: parseOptionalNumber(draft.depositAmount) ?? 0,
    imageUrls: draft.imageUrls,
    status: (draft.status as StockItemStatus) || 'available',
  }
}

function parseOptionalNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && value.trim() ? parsed : undefined
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error(`ไม่สามารถอ่านไฟล์ ${file.name} ได้`))
    reader.readAsDataURL(file)
  })
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const maybeError = error as { message?: unknown; details?: unknown; hint?: unknown }
    const parts = [maybeError.message, maybeError.details, maybeError.hint].filter(
      (part): part is string => typeof part === 'string' && part.trim().length > 0,
    )

    if (parts.length > 0) return parts.join('\n')
  }

  return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}

export type { InventoryControllerOptions }
