import { useState } from 'react';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from '@/shared/ui';

export interface BeginnerQuestionnaireProps {
  embedded?: boolean;
  onClose?: () => void;
}

interface Question {
  id: string;
  q: string;
  type: 'number' | 'choice' | 'text';
  placeholder?: string;
  choices?: string[];
}

const QUESTIONS: Question[] = [
  { id: 'age', q: 'Quel est ton âge ?', type: 'number', placeholder: 'ex: 28' },
  { id: 'sex', q: 'Ton sexe ?', type: 'choice', choices: ['Homme', 'Femme', 'Autre'] },
  { id: 'weight', q: 'Ton poids actuel (kg) ?', type: 'number', placeholder: 'ex: 75' },
  { id: 'height', q: 'Ta taille (cm) ?', type: 'number', placeholder: 'ex: 178' },
  {
    id: 'goal',
    q: 'Quel est ton objectif principal ?',
    type: 'choice',
    choices: ['Perdre du poids', 'Prendre du muscle', 'Améliorer mon endurance', 'Me remettre en forme', 'Gérer mon stress / bien-être'],
  },
  {
    id: 'level',
    q: 'Ton niveau de forme actuel ?',
    type: 'choice',
    choices: ["Débutant (jamais ou peu d'activité)", 'Intermédiaire (quelques fois par mois)', 'Régulier (1-2x/sem.)'],
  },
  { id: 'freq', q: "Combien de jours par semaine peux-tu t'entraîner ?", type: 'choice', choices: ['1-2 jours', '3-4 jours', '5-6 jours'] },
  { id: 'duration', q: 'Combien de temps par séance ?', type: 'choice', choices: ['15-30 min', '30-45 min', '45-60 min', "Plus d'1h"] },
  {
    id: 'equip',
    q: 'Quel équipement as-tu disponible ?',
    type: 'choice',
    choices: ['Aucun (poids du corps uniquement)', 'Élastiques / tapis', 'Quelques haltères', 'Salle de sport complète'],
  },
  { id: 'limit', q: 'As-tu des douleurs ou limitations physiques ?', type: 'text', placeholder: 'ex: genoux fragiles, mal de dos… ou Aucune' },
  { id: 'diet', q: 'Comment décris-tu ton alimentation actuelle ?', type: 'choice', choices: ['Très déséquilibrée', 'Correcte mais améliorable', 'Plutôt saine'] },
  { id: 'pref', q: 'Quels types d\'exercices préfères-tu ?', type: 'text', placeholder: 'ex: cardio, renforcement, mobilité… ou peu importe' },
];

const LABELS: Record<string, string> = {
  age: 'Âge',
  sex: 'Sexe',
  weight: 'Poids (kg)',
  height: 'Taille (cm)',
  goal: 'Objectif principal',
  level: 'Niveau de forme',
  freq: "Jours d'entraînement/semaine",
  duration: 'Durée par séance',
  equip: 'Équipement disponible',
  limit: 'Limitations physiques',
  diet: 'Alimentation actuelle',
  pref: "Préférences d'exercices",
};

export function BeginnerQuestionnaire({ embedded = false }: BeginnerQuestionnaireProps) {
  const { C, dawn, glowShadow } = useTheme();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const cur = QUESTIONS[step];
  const setVal = (val: string) => setAnswers((a) => ({ ...a, [cur.id]: val }));
  const canNext = Boolean(answers[cur?.id] && String(answers[cur?.id]).trim().length > 0);

  const buildPrompt = (): string => {
    const lignes = QUESTIONS.map((q) => `- ${LABELS[q.id]} : ${answers[q.id] || 'non précisé'}`).join('\n');
    return `Tu es un coach sportif et nutritionniste expert. Crée-moi un programme d'entraînement (WOD) personnalisé et progressif basé sur mon profil ci-dessous.\n\nMON PROFIL :\n${lignes}\n\nCE QUE JE VEUX :\n1. Un programme d'entraînement hebdomadaire détaillé (jours, exercices, nombre de séries, répétitions et temps de repos entre chaque)\n2. Des conseils nutritionnels simples avec un objectif calorique quotidien indicatif et la répartition des macros (protéines/glucides/lipides)\n3. Des conseils pour bien démarrer et rester motivé\n\nPrésente le programme de façon claire et structurée, exercice par exercice, pour que je puisse le suivre facilement.`;
  };

  const copy = () => {
    const txt = result || '';
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
    } else fallbackCopy(txt, done);
  };
  const fallbackCopy = (txt: string, done: () => void) => {
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch {
      /* ignore */
    }
    document.body.removeChild(ta);
  };

  if (result) {
    return (
      <div className={embedded ? 'pb-8' : 'flex-1 overflow-y-auto px-5 pt-6 pb-10'}>
        <div className="text-sm font-bold mb-2" style={{ color: C.gold }}>
          📋 Ton questionnaire est prêt
        </div>
        <div className="text-xs mb-3" style={{ color: C.dim }}>
          Copie ce texte et colle-le dans ton assistant IA préféré (ChatGPT, Claude, Gemini…) pour obtenir un programme sur mesure.
        </div>
        <div
          className="rounded-2xl p-4 mb-3 text-xs whitespace-pre-wrap"
          style={{ background: C.surf, border: `1px solid ${C.line}`, color: C.text, fontFamily: 'monospace', lineHeight: 1.5 }}
        >
          {result}
        </div>
        <button
          onClick={copy}
          className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 mb-2"
          style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
        >
          <Icon name={copied ? 'check' : 'copy'} size={18} /> {copied ? 'Copié !' : 'Copier le texte'}
        </button>
        <button
          onClick={() => {
            setResult(null);
            setStep(0);
            setAnswers({});
          }}
          className="w-full py-2.5 rounded-2xl font-semibold text-sm"
          style={{ background: C.surf2, color: C.dim }}
        >
          Recommencer
        </button>
      </div>
    );
  }

  return (
    <div className={embedded ? 'pb-8' : 'flex-1 overflow-y-auto px-5 pt-6 pb-10'}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.surf2 }}>
          <div
            className="h-full"
            style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%`, background: dawn, transition: 'width 320ms cubic-bezier(.22,1,.36,1)' }}
          />
        </div>
        <span className="text-xs tabular-nums" style={{ color: C.dim }}>
          {step + 1}/{QUESTIONS.length}
        </span>
      </div>

      <div className="text-lg font-bold mb-5">{cur.q}</div>

      {cur.type === 'choice' ? (
        <div className="space-y-2 mb-6">
          {cur.choices!.map((ch) => {
            const sel = answers[cur.id] === ch;
            return (
              <button
                key={ch}
                onClick={() => setVal(ch)}
                className="w-full text-left px-4 py-3 rounded-2xl text-sm"
                style={{
                  background: sel ? dawn : C.surf,
                  color: sel ? '#1A1206' : C.text,
                  border: `1px solid ${sel ? 'transparent' : C.line}`,
                  fontWeight: sel ? 700 : 400,
                }}
              >
                {ch}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          autoFocus
          type={cur.type === 'number' ? 'number' : 'text'}
          inputMode={cur.type === 'number' ? 'numeric' : 'text'}
          value={answers[cur.id] || ''}
          onChange={(e) => setVal(e.target.value)}
          placeholder={cur.placeholder}
          className="w-full px-4 py-3 rounded-2xl outline-none text-sm mb-6"
          style={{ background: C.surf, color: C.text, border: `1px solid ${C.line}` }}
        />
      )}

      <div className="flex gap-2">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="flex-1 py-3 rounded-2xl font-semibold text-sm" style={{ background: C.surf2, color: C.dim }}>
            Précédent
          </button>
        )}
        {step < QUESTIONS.length - 1 ? (
          <button
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="flex-[2] py-3 rounded-2xl font-bold text-sm"
            style={{ background: canNext ? dawn : C.surf2, color: canNext ? '#1A1206' : C.dim, boxShadow: canNext ? glowShadow() : 'none' }}
          >
            Suivant
          </button>
        ) : (
          <button
            disabled={!canNext}
            onClick={() => setResult(buildPrompt())}
            className="flex-[2] py-3 rounded-2xl font-bold text-sm"
            style={{ background: canNext ? dawn : C.surf2, color: canNext ? '#1A1206' : C.dim, boxShadow: canNext ? glowShadow() : 'none' }}
          >
            Générer mon programme
          </button>
        )}
      </div>
    </div>
  );
}
