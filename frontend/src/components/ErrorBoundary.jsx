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
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center font-sans gap-4 px-6 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-[#666] text-sm max-w-sm">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-[#e0322f] hover:bg-[#c92825] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}