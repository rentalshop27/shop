/* @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CustomersPage } from './CustomersPage'
import type { Customer, CustomerDraft } from './customerTypes'

const customer: Customer = {
  id: 'customer_1',
  shopId: 'shop_1',
  customerCode: 'CUS-001',
  fullName: 'Somjai',
  lineAccount: 'somjai-line',
  phone: '0812345678',
  phoneNormalized: '0812345678',
  currentAddress: 'Bangkok',
  notes: '',
  profileStatus: 'verified',
  riskFlag: 'none',
  documents: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

const draft: CustomerDraft = {
  fullName: '',
  phone: '',
  lineAccount: '',
  currentAddress: '',
  notes: '',
  profileStatus: 'incomplete',
  riskFlag: 'none',
  bustIn: '',
  waistIn: '',
  hipIn: '',
  heightCm: '',
}

describe('CustomersPage', () => {
  it('hides the archive action when no destructive handler is provided', () => {
    render(
      <CustomersPage
        currentPage={1}
        totalPages={1}
        query=""
        statusFilter="all"
        summary={{ total: 1, verified: 1, risk: 0, incomplete: 0 }}
        statusOptions={[{ value: 'all', label: 'ทั้งหมด' }]}
        paginatedCustomers={[customer]}
        selectedCustomer={customer}
        isMobileDetailOpen
        isFormOpen={false}
        editingCustomerId={null}
        draft={draft}
        draftDocuments={[]}
        existingDocuments={[]}
        formError=""
        isSaving={false}
        previewCustomerDocIndex={0}
        previewCustomerDocLoading={false}
        previewCustomerDocError=""
        onOpenCreateForm={vi.fn()}
        onQueryChange={vi.fn()}
        onStatusFilterChange={vi.fn()}
        onCurrentPageChange={vi.fn()}
        onSelectCustomer={vi.fn()}
        onMobileDetailOpenChange={vi.fn()}
        onStatusChange={vi.fn()}
        onRiskChange={vi.fn()}
        onApproveCustomerDocuments={vi.fn()}
        onDocumentUpload={vi.fn()}
        onDocumentPreviewError={vi.fn()}
        onEditCustomer={vi.fn()}
        onPreviewCustomerDocument={vi.fn()}
        onCloseForm={vi.fn()}
        onDraftChange={vi.fn()}
        onAddDraftDocuments={vi.fn()}
        onExistingDocumentRemove={vi.fn()}
        onPreviewExistingDocument={vi.fn()}
        onRemoveDraftDocument={vi.fn()}
        onResetForm={vi.fn()}
        onSaveCustomer={vi.fn()}
        onClosePreview={vi.fn()}
        rentals={[]}
      />,
    )

    expect(screen.getByRole('button', { name: 'แก้ไขข้อมูล' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'ลบลูกค้า' })).toBeNull()
  })

  it('routes document approval through the dedicated approve handler', () => {
    const onApproveCustomerDocuments = vi.fn()
    const onStatusChange = vi.fn()
    const onRiskChange = vi.fn()
    const selectedCustomer = { ...customer, profileStatus: 'pending_review' as const, riskFlag: 'has_risk' as const }

    render(
      <CustomersPage
        currentPage={1}
        totalPages={1}
        query=""
        statusFilter="all"
        summary={{ total: 1, verified: 0, risk: 1, incomplete: 0 }}
        statusOptions={[{ value: 'all', label: 'ทั้งหมด' }]}
        paginatedCustomers={[selectedCustomer]}
        selectedCustomer={selectedCustomer}
        isMobileDetailOpen
        isFormOpen={false}
        editingCustomerId={null}
        draft={draft}
        draftDocuments={[]}
        existingDocuments={[]}
        formError=""
        isSaving={false}
        previewCustomerDocIndex={0}
        previewCustomerDocLoading={false}
        previewCustomerDocError=""
        onOpenCreateForm={vi.fn()}
        onQueryChange={vi.fn()}
        onStatusFilterChange={vi.fn()}
        onCurrentPageChange={vi.fn()}
        onSelectCustomer={vi.fn()}
        onMobileDetailOpenChange={vi.fn()}
        onStatusChange={onStatusChange}
        onRiskChange={onRiskChange}
        onApproveCustomerDocuments={onApproveCustomerDocuments}
        onDocumentUpload={vi.fn()}
        onDocumentPreviewError={vi.fn()}
        onEditCustomer={vi.fn()}
        onPreviewCustomerDocument={vi.fn()}
        onCloseForm={vi.fn()}
        onDraftChange={vi.fn()}
        onAddDraftDocuments={vi.fn()}
        onExistingDocumentRemove={vi.fn()}
        onPreviewExistingDocument={vi.fn()}
        onRemoveDraftDocument={vi.fn()}
        onResetForm={vi.fn()}
        onSaveCustomer={vi.fn()}
        onClosePreview={vi.fn()}
        rentals={[]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '🟢 อนุมัติเอกสารผ่าน' }))

    expect(onApproveCustomerDocuments).toHaveBeenCalledTimes(1)
    expect(onStatusChange).not.toHaveBeenCalled()
    expect(onRiskChange).not.toHaveBeenCalled()
  })
})
