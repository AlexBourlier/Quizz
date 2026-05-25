import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink p-8">
          <div className="max-w-lg rounded-2xl border border-coral/40 bg-panel p-6">
            <h2 className="font-display text-xl text-coral">Erreur de rendu</h2>
            <pre className="mt-3 overflow-auto rounded-lg bg-ink p-3 text-xs text-slate-300">
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
            <button
              type="button"
              className="mt-4 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white"
              onClick={() => window.location.replace("/login")}
            >
              Retour au login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
