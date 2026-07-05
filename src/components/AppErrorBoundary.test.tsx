// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState, type ReactElement } from 'react'
import { AppErrorBoundary } from './AppErrorBoundary'

function BrokenPanel(): ReactElement {
  throw new Error('dashboard render exploded')
}

function BoundaryHarness() {
  const [showBrokenPanel, setShowBrokenPanel] = useState(true)

  return (
    <AppErrorBoundary onReset={() => setShowBrokenPanel(false)} resetLabel="กลับแดชบอร์ด">
      {showBrokenPanel ? <BrokenPanel /> : <p>แดชบอร์ดพร้อมใช้งาน</p>}
    </AppErrorBoundary>
  )
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a recoverable error panel instead of an empty root', () => {
    render(<BoundaryHarness />)

    expect(screen.getByRole('alert').textContent).toContain('dashboard render exploded')

    fireEvent.click(screen.getByRole('button', { name: 'กลับแดชบอร์ด' }))

    expect(screen.getByText('แดชบอร์ดพร้อมใช้งาน')).toBeTruthy()
  })
})
