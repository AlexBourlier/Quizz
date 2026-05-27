import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function AuthCard({ title, subtitle, children, onSubmit }) {
    return (_jsxs("div", { className: "mx-auto w-full max-w-md rounded-2xl border border-sky/30 bg-panel/90 p-8 shadow-glow backdrop-blur", children: [_jsx("h1", { className: "font-display text-3xl font-bold text-white", children: title }), _jsx("p", { className: "mt-2 text-sm text-slate-300", children: subtitle }), _jsx("form", { className: "mt-6 space-y-4", onSubmit: onSubmit, children: children })] }));
}
