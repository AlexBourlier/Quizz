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
  const [error, setError] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center">
        <AuthCard
          title="Connexion"
          subtitle="Bienvenue sur QuizzTest"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await login(email, password);
              navigate("/chat");
            } catch {
              setError("Identifiants invalides");
            }
          }}
        >
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2"
            placeholder="Email"
            type="email"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2"
            placeholder="Mot de passe"
            type="password"
          />
          {error && <p className="text-sm text-coral">{error}</p>}
          <button type="submit" className="w-full rounded-xl bg-coral px-4 py-2 font-semibold">
            Se connecter
          </button>
          <p className="text-sm text-slate-300">
            Pas de compte ? <Link className="text-sky" to="/register">Créer un compte</Link>
          </p>
        </AuthCard>
      </div>
    </AppLayout>
  );
}
