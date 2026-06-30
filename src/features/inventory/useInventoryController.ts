import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { InventoryControllerPageProps } from './InventoryPage'
import {
  countRemoteRentalsForProduct,
  countRemoteRentalsForStockItem,
  createProductWithVariants,
  addStockToVariant,
  deleteRemoteProduct,
  deleteRemoteStockItem,
  loadProductsWithStock,
  updateRemoteProduct,
  updateRemoteProductPublicVisibility,
  updateRemoteStockItemStatus,
} from './stockRemote'
import type { ProductDraft, ProductWithStockSummary, StockItemStatus } from './inventoryTypes'
import type { RentalOrder } from '../rentals/rentalTypes'

const emptyProductDraft: ProductDraft = {
  baseSku: '',
  productName: '',
  brand: '',
  category: '',
  primaryColor: 'น้ำเงินมิดไนต์',
  publicDescription: '',
  rentalPricePerDay: '',
  lateFeeRule: '',
  depositAmount: '',
  imageUrls: [],
  publicVisible: false,
  variants: [],
}

type InventoryControllerOptions = {
  products: ProductWithStockSummary[]
  setProducts: Dispatch<SetStateAction<ProductWithStockSummary[]>>
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

export function useInventoryController({
  products,
  setProducts,
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
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [previewProductId, setPreviewProductId] = useState<string | null>(null)
  const [previewImageIndex, setPreviewImageIndex] = useState(0)
  const [draft, setDraft] = useState<ProductDraft>(emptyProductDraft)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setQuery('')
    setIsFormOpen(false)
    setEditingProductId(null)
    setPreviewProductId(null)
    setPreviewImageIndex(0)
    setDraft(emptyProductDraft)
    setFormError('')
  }, [isAuthenticated, shopId])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return products.filter((product) => {
      const searchable = [
        product.baseSku,
        product.productName,
        product.brand,
        product.category,
        product.primaryColor,
      ].join(' ').toLowerCase()

      return !normalizedQuery || searchable.includes(normalizedQuery)
    })
  }, [products, query])

  const summary = useMemo(() => {
    let totalItems = 0
    let sets = 0
    let priced = 0
    let deposits = 0

    products.forEach((product) => {
      sets += 1
      totalItems += product.stockItems.length
      if (product.rentalPricePerDay > 0) priced += 1
      deposits += product.depositAmount
    })

    return { total: totalItems, sets, priced, deposits }
  }, [products])

  const previewItem = useMemo(() => {
    if (!previewProductId) return null
    return products.find((item) => item.id === previewProductId) ?? null
  }, [previewProductId, products])

  function updateDraft<Field extends keyof ProductDraft>(field: Field, value: ProductDraft[Field]) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function openCreateForm() {
    setEditingProductId(null)
    setDraft(emptyProductDraft)
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(product: ProductWithStockSummary) {
    setEditingProductId(product.id)
    setDraft(toEditableProductDraft(product))
    setFormError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingProductId(null)
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

  function openPreview(product: ProductWithStockSummary, index = 0) {
    if (!product.imageUrls.length) return
    setPreviewProductId(product.id)
    setPreviewImageIndex(index)
  }

  function closePreview() {
    setPreviewProductId(null)
    setPreviewImageIndex(0)
  }

  async function handleDeleteProduct(product: ProductWithStockSummary) {
    try {
      if (supabase && isAuthenticated && shopId) {
        const rentalsCount = await countRemoteRentalsForProduct(supabase, shopId, product.id)
        if (rentalsCount > 0) {
          window.alert(`ยังลบชุด ${product.baseSku} ไม่ได้ เพราะมีคิวเช่าสำหรับลูกชุด ${rentalsCount} รายการ`)
          return
        }
      }
    } catch (error) {
      window.alert(getErrorMessage(error))
      return
    }

    const confirmed = window.confirm(
      `คุณต้องการลบชุด "${product.productName}" (${product.baseSku}) รวมถึงรายการตัวชุดย่อยทั้งหมดใช่หรือไม่?\n\nข้อมูลชุดและรูปภาพจะถูกลบออกจากระบบ`,
    )
    if (!confirmed) return

    setIsSaving(true)
    try {
      if (supabase && isAuthenticated && shopId) {
        await deleteRemoteProduct(supabase, shopId, product.id, product.imageUrls)
        await onLoadAuditLogs()
      }
      setProducts((current) => current.filter((p) => p.id !== product.id))
      if (editingProductId === product.id) closeForm()
      if (previewProductId === product.id) closePreview()
    } catch (error) {
      window.alert(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteVariant(productId: string, stockId: string) {
    try {
      if (supabase && isAuthenticated && shopId) {
        const rentalsCount = await countRemoteRentalsForStockItem(supabase, shopId, stockId)
        if (rentalsCount > 0) {
          window.alert(`ไม่สามารถลบลูกชุดนี้ได้ เพราะมีคิวเช่าแล้ว`)
          return
        }
      }
    } catch (error) {
      window.alert(getErrorMessage(error))
      return
    }

    const confirmed = window.confirm('คุณต้องการลบรายการชุดย่อยนี้ใช่หรือไม่?')
    if (!confirmed) return

    setIsSaving(true)
    try {
      if (supabase && isAuthenticated && shopId) {
        await deleteRemoteStockItem(supabase, shopId, stockId)
        await onLoadAuditLogs()
      }
      setProducts((current) =>
        current.map((p) =>
          p.id === productId ? { ...p, stockItems: p.stockItems.filter((si) => si.id !== stockId) } : p
        )
      )
    } catch (error) {
      window.alert(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAddStock(productId: string, size: string, quantity: number) {
    setIsSaving(true)
    try {
      if (supabase && isAuthenticated && shopId) {
        await addStockToVariant(supabase, shopId, productId, size, quantity)
        // Refresh whole stock to get new variants
        const reloaded = await loadProductsWithStock(supabase, shopId)
        setProducts(reloaded)
        await onLoadAuditLogs()
      }
    } catch (error) {
      window.alert(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateStatus(productId: string, stockId: string, newStatus: StockItemStatus) {
    try {
      if (supabase && isAuthenticated && shopId) {
        await updateRemoteStockItemStatus(supabase, shopId, stockId, newStatus)
        await onLoadAuditLogs()
      }
      setProducts((current) =>
        current.map((p) =>
          p.id === productId
            ? {
                ...p,
                stockItems: p.stockItems.map((si) => (si.id === stockId ? { ...si, status: newStatus } : si)),
              }
            : p
        )
      )
    } catch (error) {
      window.alert(getErrorMessage(error))
    }
  }

  async function handleTogglePublicVisibility(productId: string, publicVisible: boolean) {
    try {
      if (supabase && isAuthenticated && shopId) {
        await updateRemoteProductPublicVisibility(supabase, shopId, productId, publicVisible)
        await onLoadAuditLogs()
      }
      setProducts((current) =>
        current.map((p) => (p.id === productId ? { ...p, publicVisible } : p)),
      )
    } catch (error) {
      window.alert(getErrorMessage(error))
    }
  }

  async function handleSave() {
    setFormError('')
    const normalizedDraft = normalizeProductDraft(draft)

    if (!normalizedDraft.baseSku) {
      setFormError('กรุณากรอก Base SKU/รหัสหลักของชุด')
      return
    }
    if (!normalizedDraft.productName) {
      setFormError('กรุณากรอกชื่อสินค้า')
      return
    }

    if (!editingProductId) {
      // Create new product
      if (products.some((p) => p.baseSku.toLowerCase() === normalizedDraft.baseSku.toLowerCase())) {
        setFormError('Base SKU นี้มีอยู่แล้วในระบบ')
        return
      }

      if (normalizedDraft.variants.length === 0) {
        setFormError('กรุณาเพิ่มรายการชุดอย่างน้อย 1 รายการ')
        return
      }
    }

    setIsSaving(true)
    try {
      if (supabase && isAuthenticated && shopId) {
        if (editingProductId) {
          await updateRemoteProduct(
            supabase,
            shopId,
            editingProductId,
            normalizedDraft
          )
        } else {
          await createProductWithVariants(supabase, shopId, normalizedDraft)
        }
        
        // Reload all products to get correct db-generated IDs/SKUs
        const reloaded = await loadProductsWithStock(supabase, shopId)
        setProducts(reloaded)
        await onLoadAuditLogs()
        closeForm()
      }
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const pageProps: InventoryControllerPageProps = {
    products: filteredProducts,
    query,
    setQuery,
    summary,
    isFormOpen,
    isEditing: Boolean(editingProductId),
    draft,
    formError,
    isSaving,
    onOpenForm: openCreateForm,
    onCloseForm: closeForm,
    onEdit: openEditForm,
    onDeleteProduct: handleDeleteProduct,
    onDeleteVariant: handleDeleteVariant,
    onAddStock: handleAddStock,
    onPreview: openPreview,
    onDraftChange: updateDraft,
    onResetDraft: () => setDraft(emptyProductDraft),
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
    onTogglePublicVisibility: handleTogglePublicVisibility,
  }

  return { pageProps }
}

function toEditableProductDraft(product: ProductWithStockSummary): ProductDraft {
  return {
    baseSku: product.baseSku,
    productName: product.productName,
    brand: product.brand,
    category: product.category,
    primaryColor: product.primaryColor,
    publicDescription: product.publicDescription,
    rentalPricePerDay: product.rentalPricePerDay ? String(product.rentalPricePerDay) : '',
    lateFeeRule: product.lateFeeRule,
    depositAmount: product.depositAmount ? String(product.depositAmount) : '',
    imageUrls: product.imageUrls ?? [],
    publicVisible: product.publicVisible,
    variants: [], // Editing happens at product level, variants are managed separately in cards
  }
}

function normalizeProductDraft(draft: ProductDraft): ProductDraft {
  return {
    ...draft,
    baseSku: draft.baseSku.trim(),
    productName: draft.productName.trim(),
    brand: draft.brand.trim(),
    category: draft.category.trim(),
    primaryColor: draft.primaryColor.trim(),
    publicDescription: draft.publicDescription.trim(),
    rentalPricePerDay: parseOptionalNumber(draft.rentalPricePerDay) !== undefined ? draft.rentalPricePerDay : '',
    lateFeeRule: draft.lateFeeRule.trim(),
    depositAmount: parseOptionalNumber(draft.depositAmount) !== undefined ? draft.depositAmount : '',
    variants: draft.variants.filter((v) => v.quantity > 0)
  }
}

function parseOptionalNumber(value: string | number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && String(value).trim() ? parsed : undefined
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
