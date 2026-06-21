import { useState } from 'react';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from '@/shared/ui';

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const { C } = useTheme();
  return (
    <div className="rounded-2xl mb-2 overflow-hidden" style={{ background: C.surf, border: `1px solid ${C.line}` }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="text-sm font-semibold">{q}</span>
        <Icon
          name="down"
          size={14}
          color={C.dim}
          style={{
            transition: 'transform 320ms cubic-bezier(.22,1,.36,1)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 320ms cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ minHeight: 0, overflow: 'hidden', opacity: open ? 1 : 0, transition: `opacity 220ms ease ${open ? '60ms' : '0ms'}` }}>
          <div className="px-4 pb-3 text-sm leading-relaxed" style={{ color: C.dim }}>
            {a}
          </div>
        </div>
      </div>
    </div>
  );
}

const FAQ_ITEMS: [string, string, string][] = [
  ['nav', "Comment l'app est organisée ?", "Trois onglets en bas de l'écran : Séance (ta routine du jour, lanceur d'exercices et WOD), Nutrition (journal alimentaire et rapports), et Suivi (frise/calendrier, habitudes, agenda). Le bouton ⚙️ en haut de chaque onglet ouvre les Réglages, accessibles partout."],
  ['seance', 'Comment fonctionne le lanceur de séance ?', "Touche « Démarrer » pour lancer ta séance du jour, exercice par exercice. Chaque étape affiche les répétitions à faire ou un minuteur de repos/temps. Si tu quittes en cours de route, « Reprendre » réapparaît pour continuer où tu en étais."],
  ['wod', 'Comment ajouter ou modifier un WOD ?', "Réglages → Training → WOD. Tu peux créer un WOD à la main, ou coller un texte au format « Nom | minutes » suivi d'une ligne par exercice avec le nombre de répétitions — il sera importé automatiquement."],
  ['sport', 'Comment marquer ma séance comme faite ?', "Le bouton « Marquer Sport fait » dans l'onglet Séance, ou automatiquement à la fin du lanceur ou du WOD. Ça coche l'habitude « Sport » du jour, visible dans Suivi."],
  ['nutrition', 'Comment fonctionne le journal alimentaire ?', "Dans l'onglet Nutrition, touche le + sur un repas pour ajouter un aliment (ta bibliothèque, recherche dans la base Ciqual, ou création manuelle). Les totaux du jour et de chaque repas s'affichent en haut. L'onglet « Rapports » donne une vue hebdomadaire : calories par jour, répartition par repas et macros."],
  ['objectifs', "Comment régler mes objectifs caloriques et d'eau ?", "Réglages → Nutrition : un objectif de calories différent selon le type de jour (séance, récupération, repos), plus un objectif d'eau quotidien."],
  ['frise', 'Comment lire la frise dans Suivi ?', "Chaque ligne représente un jour. Le liseré coloré à gauche indique le statut du cycle d'entraînement (vert = semaine active, gris = semaine off). À droite, les liserés correspondent à tes catégories de « Périodes ». Les petits points signalent un jour parfait (toutes les habitudes faites) ou la présence de rendez-vous."],
  ['legende', 'À quoi sert la légende en haut de Suivi ?', "Les chips Statuts / Cycle / Périodes / RDV sont cliquables : touche-en une pour faire défiler la frise jusqu'à la prochaine occurrence correspondante. Touche plusieurs fois de suite pour avancer occurrence par occurrence dans le temps."],
  ['jour', 'À quoi sert le panneau du jour ?', "En touchant un jour dans la frise, le panneau à droite affiche : Habitudes (cases à cocher), Rendez-vous, À faire, et une Note libre — chaque section est repliable et fermée par défaut."],
  ['rdv', 'Comment fonctionnent les catégories de RDV ?', "Réglages → Tableau de bord → Catégories RDV : crée des catégories avec une couleur et un nom. Quand tu ajoutes un rendez-vous dans le panneau du jour, choisis une catégorie — elle apparaît ensuite dans la légende de Suivi, cliquable pour retrouver tes prochains RDV de ce type."],
  ['cycle', "Comment fonctionne le cycle d'entraînement ?", "Par défaut, le cycle suit un rythme de 9 semaines (8 actives puis 1 de décharge) à partir de ta date de départ. Tu peux aussi définir manuellement des périodes « actif »/« off » dans Réglages → Tableau de bord → Agenda."],
  ['theme', "Comment changer l'apparence de l'app ?", "Réglages → Apparence : choix du thème (Aube, Nuit, Ardoise, Aurore, Forêt…), couleur d'accent personnalisée, et niveau de transparence de la barre de navigation."],
  ['horsligne', "L'app fonctionne sans connexion internet ?", "Tes données sont mises en cache sur l'appareil : si la connexion coupe, tu peux continuer à consulter et modifier, et tout se synchronise automatiquement au retour du réseau. Un badge « Hors ligne » apparaît en haut de l'écran si besoin. Le tout premier chargement de la page nécessite toujours internet."],
  ['sauvegarde', 'Comment sauvegarder mes données ?', "Réglages → Data opérateur → « Exporter mes données » télécharge un fichier JSON contenant tout ton historique (séances, repas, habitudes, agenda)."],
  ['motdepasse', "J'ai oublié mon mot de passe, que faire ?", "Sur l'écran de connexion, saisis ton email puis touche « Mot de passe oublié ? » — un lien de réinitialisation te sera envoyé par email."],
];

export function HelpSettings() {
  const { C } = useTheme();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div className="px-5 pb-10">
      <div className="text-sm mb-4 mt-2" style={{ color: C.dim }}>
        Petit guide de l'app — touche une question pour dérouler la réponse.
      </div>
      {FAQ_ITEMS.map(([k, q, a]) => (
        <FaqItem key={k} q={q} a={a} open={!!open[k]} onToggle={() => toggle(k)} />
      ))}
    </div>
  );
}
