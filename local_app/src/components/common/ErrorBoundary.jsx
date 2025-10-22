import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <h1 className="font-bold">Oops! Algo salió mal.</h1>
          <p>Hubo un error al renderizar esta parte de la aplicación.</p>
          {this.state.error && <pre className="mt-2 text-xs whitespace-pre-wrap">{this.state.error.toString()}</pre>}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;