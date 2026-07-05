import { Component, type ErrorInfo, type ReactNode } from 'react'

type AppErrorBoundaryProps = {
  children: ReactNode
  title?: string
  description?: string
  resetLabel?: string
  resetKey?: string | number | null
  onReset?: () => void
}

type AppErrorBoundaryState = {
  error: Error | null
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App render failed:', error, errorInfo)
  }

  componentDidUpdate(previousProps: AppErrorBoundaryProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  private handleReset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render() {
    const { error } = this.state

    if (!error) {
      return this.props.children
    }

    const title = this.props.title ?? 'เปิดหน้าแอปไม่สำเร็จ'
    const description = this.props.description ?? 'ระบบพบข้อผิดพลาดระหว่างแสดงผลหน้านี้'

    return (
      <section className="runtime-error-panel" role="alert">
        <p className="eyebrow">Precious Shop</p>
        <h1>{title}</h1>
        <p className="subtitle">{description}</p>
        <pre>{error.message || 'Unknown render error'}</pre>
        <div className="runtime-error-actions">
          {this.props.onReset && (
            <button className="secondary-button" type="button" onClick={this.handleReset}>
              {this.props.resetLabel ?? 'ลองกลับไปหน้าแดชบอร์ด'}
            </button>
          )}
          <button className="primary-button" type="button" onClick={() => window.location.reload()}>
            โหลดหน้าใหม่
          </button>
        </div>
      </section>
    )
  }
}
