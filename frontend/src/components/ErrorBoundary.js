import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
export class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error) {
        return { error };
    }
    render() {
        if (this.state.error) {
            return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-ink p-8", children: _jsxs("div", { className: "max-w-lg rounded-2xl border border-coral/40 bg-panel p-6", children: [_jsx("h2", { className: "font-display text-xl text-coral", children: "Erreur de rendu" }), _jsxs("pre", { className: "mt-3 overflow-auto rounded-lg bg-ink p-3 text-xs text-slate-300", children: [this.state.error.message, "\n\n", this.state.error.stack] }), _jsx("button", { type: "button", className: "mt-4 rounded-xl bg-coral px-4 py-2 text-sm font-semibold text-white", onClick: () => window.location.replace("/login"), children: "Retour au login" })] }) }));
        }
        return this.props.children;
    }
}
