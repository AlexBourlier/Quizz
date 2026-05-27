import { jsx as _jsx } from "react/jsx-runtime";
export function AppLayout({ children }) {
    return (_jsx("div", { className: "flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,#24364a_0%,#131922_45%,#0b0f15_100%)] px-4 py-4 font-body text-white lg:px-6", children: _jsx("div", { className: "mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden animate-[fadeIn_0.6s_ease]", children: children }) }));
}
