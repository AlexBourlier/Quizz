import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toasts } from "./components/Toast";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { useAuthStore } from "./store/auth.store";
export function App() {
    const token = useAuthStore((state) => state.accessToken);
    return (_jsxs(ErrorBoundary, { children: [_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/chat", element: token ? _jsx(ChatPage, {}) : _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: token ? "/chat" : "/login", replace: true }) })] }), _jsx(Toasts, {})] }));
}
