import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import { useUIStore } from "./stores/ui";

// Global error handlers — surface ALL uncaught errors as toasts
window.onerror = (_event, _source, _line, _col, error) => {
  const message = error?.message ?? String(_event);
  console.error("[global:error]", message, error);
  useUIStore.getState().addToast({
    title: "Uncaught error",
    description: message,
  });
};

window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const message = event.reason?.message ?? String(event.reason);
  console.error("[global:unhandledrejection]", message, event.reason);
  useUIStore.getState().addToast({
    title: "Unhandled promise rejection",
    description: message,
  });
};

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) {
    useUIStore.getState().addToast({
      title: "React crash",
      description: error.message,
    });
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          <h1 style={{ color: "red" }}>App crashed</h1>
          <p>{this.state.error.message}</p>
          <pre>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
