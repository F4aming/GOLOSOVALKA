import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
          <h1 style={{ fontSize: '1.25rem' }}>Ошибка при отображении приложения</h1>
          <pre
            style={{
              marginTop: 16,
              whiteSpace: 'pre-wrap',
              color: '#b00020',
              fontSize: 13,
              border: '1px solid #ccc',
              padding: 12,
              background: '#fff8f8',
            }}
          >
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Элемент #root не найден в index.html')
}

ReactDOM.createRoot(rootEl).render(
  <RootErrorBoundary>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </RootErrorBoundary>,
)