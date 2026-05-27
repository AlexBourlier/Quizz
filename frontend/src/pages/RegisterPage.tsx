import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/AuthCard";
import { AppLayout } from "../layouts/AppLayout";
import { useAuthStore } from "../store/auth.store";

export function RegisterPage() {
  const navigate  = useNavigate();
  const register  = useAuthStore((state) => state.register);
  const [username,   setUsername]   = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [birthDate,  setBirthDate]  = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [info,       setInfo]       = useState<string | null>(null);
  const [loading,    setLoading]    = useState(false);

  // Determine age from birthDate to conditionally show parent email field
  const age = birthDate
    ? (() => {
        const d = new Date(birthDate);
        const now = new Date();
        let a = now.getFullYear() - d.getFullYear();
        const m = now.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
        return a;
      })()
    : null;

  const needsParentEmail = age !== null && age < 15;

  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center">
        <AuthCard
          title="Inscription"
          subtitle="Rejoins les salons et le QuizBot"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setInfo(null);

            if (!tosAccepted) {
              setError("Vous devez accepter les conditions d'utilisation");
              return;
            }
            if (!birthDate) {
              setError("La date de naissance est obligatoire");
              return;
            }
            if (needsParentEmail && !parentEmail) {
              setError("L'email du responsable légal est requis pour les moins de 15 ans");
              return;
            }

            setLoading(true);
            try {
              const result = await register(username, email, password, birthDate, parentEmail || undefined);
              if (result?.needsEmailVerification) {
                setInfo("Compte créé ! Vérifiez votre boîte email pour activer votre compte.");
                if (result.needsParentalConsent) {
                  setInfo("Compte créé ! Un email a été envoyé à votre responsable légal pour valider votre inscription.");
                }
              } else {
                navigate("/chat");
              }
            } catch (err: unknown) {
              const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
              setError(axiosMsg || (err as Error).message || "Impossible de créer le compte");
            } finally {
              setLoading(false);
            }
          }}
        >
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2"
            placeholder="Pseudo"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2"
            placeholder="Email"
            type="email"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2"
            placeholder="Mot de passe (8 caractères min.)"
            type="password"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400">Date de naissance *</label>
            <input
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-ink px-3 py-2"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {needsParentEmail && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
              Les moins de 15 ans ont besoin de l'accord d'un responsable légal.
              <input
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-ink px-3 py-2 text-white"
                placeholder="Email du responsable légal"
                type="email"
              />
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={tosAccepted}
              onChange={(e) => setTosAccepted(e.target.checked)}
              className="mt-0.5 shrink-0 accent-coral"
            />
            <span>
              J'ai lu et j'accepte les{" "}
              <Link className="text-sky underline" to="/terms">
                conditions d'utilisation
              </Link>{" "}
              et la{" "}
              <Link className="text-sky underline" to="/privacy">
                politique de confidentialité
              </Link>
            </span>
          </label>

          {error && <p className="text-sm text-coral">{error}</p>}
          {info  && <p className="text-sm text-emerald-400">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-coral px-4 py-2 font-semibold disabled:opacity-50"
          >
            {loading ? "Création…" : "Créer mon compte"}
          </button>
          <p className="text-sm text-slate-300">
            Déjà inscrit ?{" "}
            <Link className="text-sky" to="/login">
              Connexion
            </Link>
          </p>
        </AuthCard>
      </div>
    </AppLayout>
  );
}
