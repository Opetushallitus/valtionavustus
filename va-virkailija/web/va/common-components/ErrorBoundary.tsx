import React from 'react'

type ErrorBoundaryProps = React.PropsWithChildren<void>

type ErrorState = { hasError: false } | { hasError: true; error: Error }

type ErrorBoundaryState = ErrorState & { copyMsg: string }

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, copyMsg: '' }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  async onCopy(text: string | undefined) {
    if (!text) {
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      this.setState((state) => ({ ...state, copyMsg: 'Virheviesti kopioitu' }))
    } catch (e) {
      this.setState((state) => ({ ...state, copyMsg: 'Virheviestin kopiointi epäonnistui' }))
    }
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error.stack
      return (
        <div>
          <h1>Erhe on tapahtunut</h1>
          <pre>{error}</pre>
          <button onClick={() => this.onCopy(error)}>Kopioi virheviesti leikepöydälle</button>
          <span>{this.state.copyMsg}</span>
        </div>
      )
    }

    return this.props.children
  }
}
