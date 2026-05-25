import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { AppLayout } from "../layouts/AppLayout";
import { useAuthStore } from "../store/auth.store";

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center">
        <AuthCard
          title="Inscription"
          subtitle="Rejoins les salons et le QuizBot"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await register(username, email, password);
              navigate("/chat");
            } catch {
              setError("Impossible de créer le compte");
            }
          }}
        >
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2"
            placeholder="Pseudo"
          />
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
            Créer mon compte
          </button>
          <p className="text-sm text-slate-300">
            Déjà inscrit ? <Link className="text-sky" to="/login">Connexion</Link>
          </p>
        </AuthCard>
      </div>
    </AppLayout>
  );
}
