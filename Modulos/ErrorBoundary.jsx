import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="login-root">
          <div className="login-bg">
            <div className="bg-overlay" />
            <div className="bg-shapes">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="login-shell">
            <div className="login-panel" style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", color: "#dc2626" }}>⚠</div>
              <h1 style={{ color: "#1C2B3A", fontSize: "20px", marginBottom: "1rem" }}>
                Ha ocurrido un error
              </h1>
              <p style={{ color: "#5A6A7F", fontSize: "14px", marginBottom: "2rem" }}>
                No se pudo cargar la vista. Por favor, recargue la página.
              </p>
              <button
                className="login-btn"
                onClick={() => window.location.reload()}
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
