import type {
  Customer,
  CustomerDraft,
  CustomerDuplicateResult,
  CustomerProfileStatus,
} from './customerTypes'

export const CUSTOMER_DOCUMENT_LIMIT = 5

export const profileStatusLabel: Record<CustomerProfileStatus, string> = {
  incomplete: 'ข้อมูลไม่ครบ',
  pending_review: 'รอตรวจ',
  verified: 'ตรวจแล้ว',
  suspended: 'ระงับ',
}

export const profileStatusTone: Record<CustomerProfileStatus, string> = {
  incomplete: 'muted',
  pending_review: 'warning',
  verified: 'success',
  suspended: 'danger',
}

export function normalizeThaiPhone(phone: string) {
  return phone.replace(/[^\d]/g, '')
}

export function validateThaiPhone(phone: string) {
  const normalized = normalizeThaiPhone(phone)
  return /^0\d{9}$/.test(normalized)
}

export function findPhoneDuplicate(
  customers: Customer[],
  phone: string,
  currentCustomerId?: string,
): CustomerDuplicateResult {
  const normalized = normalizeThaiPhone(phone)
  const duplicate = customers.find(
    (customer) =>
      customer.phoneNormalized === normalized &&
      customer.id !== currentCustomerId &&
      !customer.archivedAt,
  )

  return duplicate ? { kind: 'phone', customer: duplicate } : { kind: 'none' }
}

export function resolveInitialProfileStatus(draft: CustomerDraft) {
  const hasRequiredFields = draft.fullName.trim() && validateThaiPhone(draft.phone)

  if (!hasRequiredFields) {
    return 'incomplete' satisfies CustomerProfileStatus
  }

  if (draft.profileStatus === 'verified' || draft.profileStatus === 'suspended') {
    return draft.profileStatus
  }

  return 'incomplete' satisfies CustomerProfileStatus
}

export function canCreateRentalForCustomer(customer: Customer) {
  if (customer.profileStatus === 'suspended') {
    return {
      allowed: false,
      message: 'ลูกค้าถูกระงับ ไม่สามารถสร้างรายการเช่าใหม่ได้',
    }
  }

  if (customer.profileStatus === 'incomplete' || customer.profileStatus === 'pending_review') {
    return {
      allowed: true,
      message: 'ลูกค้ายังไม่ได้ตรวจครบ ควรตรวจเอกสารก่อนปล่อยชุด',
    }
  }

  return {
    allowed: true,
    message: '',
  }
}

export function canAddMoreDocuments(currentCount: number, incomingCount = 1) {
  return currentCount + incomingCount <= CUSTOMER_DOCUMENT_LIMIT
}

export function formatMeasurements(customer: Customer) {
  return [
    { label: 'รอบอก', value: customer.bustIn ? `${customer.bustIn}"` : '-' },
    { label: 'รอบเอว', value: customer.waistIn ? `${customer.waistIn}"` : '-' },
    { label: 'สะโพก', value: customer.hipIn ? `${customer.hipIn}"` : '-' },
    { label: 'ส่วนสูง', value: customer.heightCm ? `${customer.heightCm} cm` : '-' },
  ]
}

