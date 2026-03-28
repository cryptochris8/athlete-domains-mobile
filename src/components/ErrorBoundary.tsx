import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  gameName?: string
  /** When true, renders null on error (safe for R3F Canvas). Default: false */
  canvasSafe?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.gameName ?? 'Game'}] Error:`, error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      // Inside R3F Canvas, we cannot render DOM elements - return null
      if (this.props.canvasSafe) return null

      return (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A1A2E',
          color: '#fff',
          gap: '1rem',
          zIndex: 100,
        }}>
          <div style={{ fontSize: '3rem' }}>Oops!</div>
          <div style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            Something went wrong in {this.props.gameName ?? 'the game'}.
          </div>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.8rem 2rem',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '12px',
              background: '#FF6B35',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              marginTop: '0.5rem',
            }}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
