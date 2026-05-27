import { useState } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../store/auth.store";

type Props = { onAccepted: () => void };

export function TermsModal({ onAccepted }: Props) {
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setScrolled(true);
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/users/me/accept-terms");
      useAuthStore.getState().patchUser({ termsAcceptedAt: data.termsAcceptedAt });
      onAccepted();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-panel shadow-2xl">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="font-display text-xl text-white">Charte de bonne conduite</h2>
          <p className="mt-1 text-sm text-slate-400">
            Veuillez lire et accepter cette charte avant de participer.
          </p>
        </div>

        <div
          onScroll={handleScroll}
          className="max-h-96 overflow-y-auto px-6 py-4 text-sm leading-relaxed text-slate-300"
        >
          <h3 className="mb-2 font-semibold text-white">Article 1 — Objet</h3>
          <p className="mb-4">
            La présente charte définit les règles de comportement applicables à tout utilisateur de
            la plateforme QuizzTest (ci-après « la Plateforme »). En utilisant les services de
            messagerie, de quiz interactif et de communication proposés, vous vous engagez à
            respecter l'intégralité des dispositions ci-dessous.
          </p>

          <h3 className="mb-2 font-semibold text-white">Article 2 — Respect et civilité</h3>
          <p className="mb-4">
            Tout utilisateur s'engage à interagir avec les autres membres dans le respect mutuel.
            Sont strictement interdits : les propos injurieux, dégradants, discriminatoires ou
            haineux fondés sur l'origine, le sexe, l'orientation sexuelle, la religion, le handicap
            ou toute autre caractéristique personnelle. Le harcèlement, l'intimidation, les menaces
            et toute forme de cyberviolence sont également prohibés.
          </p>

          <h3 className="mb-2 font-semibold text-white">Article 3 — Protection de la vie privée</h3>
          <p className="mb-4">
            Il est interdit de divulguer sans consentement les données personnelles d'autrui
            (adresse, numéro de téléphone, photographies, informations financières, etc.). Toute
            tentative de collecte ou d'exploitation non autorisée de données personnelles est
            prohibée et peut faire l'objet de poursuites conformément au Règlement Général sur la
            Protection des Données (RGPD) et à la loi Informatique et Libertés.
          </p>

          <h3 className="mb-2 font-semibold text-white">Article 4 — Contenu illicite et droits d'auteur</h3>
          <p className="mb-4">
            Il est interdit de publier tout contenu contraire aux lois et réglementations en
            vigueur, notamment : contenus à caractère pédopornographique, apologie de crimes contre
            l'humanité, incitation à la haine ou à la violence, contenu portant atteinte aux droits
            de propriété intellectuelle d'un tiers. L'utilisateur garantit être titulaire des droits
            sur tout contenu qu'il publie ou disposer des autorisations nécessaires.
          </p>

          <h3 className="mb-2 font-semibold text-white">Article 5 — Spam et publicité</h3>
          <p className="mb-4">
            Toute forme de messages répétitifs non sollicités (spam), de publicité commerciale non
            autorisée, de phishing, de liens malveillants ou de sollicitations à caractère financier
            est interdite sur la Plateforme.
          </p>

          <h3 className="mb-2 font-semibold text-white">Article 6 — Utilisation loyale de la Plateforme</h3>
          <p className="mb-4">
            L'utilisateur s'interdit de tenter de contourner les systèmes de sécurité, d'exploiter
            des failles techniques, d'usurper l'identité d'un autre utilisateur ou d'un membre de
            l'équipe modératrice, ou d'utiliser des scripts automatisés non autorisés. Toute
            tentative d'attaque informatique (injection, DDoS, etc.) entraîne un signalement
            immédiat aux autorités compétentes.
          </p>

          <h3 className="mb-2 font-semibold text-white">Article 7 — Modération et sanctions</h3>
          <p className="mb-4">
            L'équipe de modération se réserve le droit de supprimer tout contenu enfreignant la
            présente charte et de prendre les mesures suivantes, sans préavis ni remboursement :
            avertissement, réduction temporaire des droits d'écriture (timeout), expulsion d'un
            salon (kick), ou bannissement définitif du compte. Les décisions de modération sont
            souveraines et ne peuvent faire l'objet d'appel que via le formulaire de contact
            officiel.
          </p>

          <h3 className="mb-2 font-semibold text-white">Article 8 — Responsabilité de l'utilisateur</h3>
          <p className="mb-4">
            Chaque utilisateur est personnellement responsable des contenus qu'il publie. La
            Plateforme décline toute responsabilité pour les préjudices découlant du non-respect de
            la présente charte. En cas d'infraction grave, les éléments nécessaires pourront être
            communiqués aux autorités judiciaires compétentes conformément à la législation
            française en vigueur (loi LCEN, Code pénal).
          </p>

          <h3 className="mb-2 font-semibold text-white">Article 9 — Mise à jour de la charte</h3>
          <p className="mb-4">
            La présente charte peut être mise à jour à tout moment. Les utilisateurs seront
            informés de toute modification substantielle. L'utilisation continue de la Plateforme
            après notification vaut acceptation des nouvelles dispositions.
          </p>

          <p className="mt-4 rounded-xl border border-sky/20 bg-sky/5 p-3 text-xs text-slate-400">
            En cliquant sur « J'accepte la charte », vous confirmez avoir lu et compris l'intégralité
            des dispositions ci-dessus et vous engagez à les respecter.
            Cette acceptation est enregistrée avec horodatage dans notre système.
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <p className="text-xs text-slate-500">
            {scrolled ? "✓ Charte lue" : "Faites défiler pour lire la charte en entier"}
          </p>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!scrolled || loading}
            className="rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Enregistrement…" : "J'accepte la charte"}
          </button>
        </div>
      </div>
    </div>
  );
}
