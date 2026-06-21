export type CustomerProfileStatus =
  | 'incomplete'
  | 'pending_review'
  | 'verified'
  | 'suspended'

export type RiskFlag = 'none' | 'has_risk'

export type CustomerDocument = {
  id: string
  customerId: string
  storagePath: string
  storageProvider: 'supabase_storage' | 'google_drive'
  externalFileId?: string
  mimeType?: string
  originalFileName?: string
  previewUrl?: string
  sortOrder: number
  createdAt: string
}

export type Customer = {
  id: string
  shopId: string
  customerCode: string
  fullName: string
  lineAccount: string
  phone: string
  phoneNormalized: string
  currentAddress: string
  notes: string
  profileStatus: CustomerProfileStatus
  riskFlag: RiskFlag
  bustIn?: number
  waistIn?: number
  hipIn?: number
  heightCm?: number
  archivedAt?: string
  documents: CustomerDocument[]
  createdAt: string
  updatedAt: string
}

export type CustomerDraft = {
  fullName: string
  lineAccount: string
  phone: string
  currentAddress: string
  notes: string
  profileStatus: CustomerProfileStatus
  riskFlag: RiskFlag
  bustIn: string
  waistIn: string
  hipIn: string
  heightCm: string
}

export type CustomerDuplicateResult =
  | { kind: 'none' }
  | { kind: 'phone'; customer: Customer }
