import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNotificationStore } from "../store/notification.store";
const STYLES = {
    info: "border-sky/40 bg-sky/10 text-sky",
    success: "border-mint/40 bg-mint/10 text-mint",
    warning: "border-amber-400/40 bg-amber-400/10 text-amber-400",
    error: "border-coral/40 bg-coral/10 text-coral",
};
export function Toasts() {
    const { toasts, removeToast } = useNotificationStore();
    if (toasts.length === 0)
        return null;
    return (_jsx("div", { className: "fixed bottom-6 right-6 z-50 flex flex-col gap-2", children: toasts.map((t) => (_jsxs("div", { className: `flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${STYLES[t.type]}`, children: [_jsx("p", { className: "flex-1 text-sm font-medium", children: t.message }), _jsx("button", { type: "button", onClick: () => removeToast(t.id), className: "mt-0.5 opacity-60 hover:opacity-100", children: "\u2715" })] }, t.id))) }));
}
