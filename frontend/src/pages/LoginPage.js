import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { AppLayout } from "../layouts/AppLayout";
import { useAuthStore } from "../store/auth.store";
export function LoginPage() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    return (_jsx(AppLayout, { children: _jsx("div", { className: "flex min-h-[calc(100vh-2rem)] items-center justify-center", children: _jsxs(AuthCard, { title: "Connexion", subtitle: "Bienvenue sur QuizzTest", onSubmit: async (event) => {
                    event.preventDefault();
                    try {
                        await login(email, password);
                        navigate("/chat");
                    }
                    catch {
                        setError("Identifiants invalides");
                    }
                }, children: [_jsx("input", { value: email, onChange: (event) => setEmail(event.target.value), className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2", placeholder: "Email", type: "email" }), _jsx("input", { value: password, onChange: (event) => setPassword(event.target.value), className: "w-full rounded-xl border border-white/10 bg-ink px-3 py-2", placeholder: "Mot de passe", type: "password" }), error && _jsx("p", { className: "text-sm text-coral", children: error }), _jsx("button", { type: "submit", className: "w-full rounded-xl bg-coral px-4 py-2 font-semibold", children: "Se connecter" }), _jsxs("p", { className: "text-sm text-slate-300", children: ["Pas de compte ? ", _jsx(Link, { className: "text-sky", to: "/register", children: "Cr\u00E9er un compte" })] })] }) }) }));
}
