import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="screen-status error-screen stack">
          <h1>Something went wrong</h1>
          <p className="muted">Try opening the journal again.</p>
          <a href="/" className="button primary">Open journal</a>
        </main>
      );
    }

    return this.props.children;
  }
}
