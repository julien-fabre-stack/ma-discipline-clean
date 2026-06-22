import { useRef, useState } from 'react';
import type { AppData, Profile } from '@/types';
import { ageFrom, dateKey } from '@/lib/utils';
import { resizeImage } from '@/lib/image';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, useConfirm } from '@/shared/ui';

export interface ProfileSettingsProps {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
}

export function ProfileSettings({ data, update }: ProfileSettingsProps) {
  const { C, dawn, cardShadow, glowShadow } = useTheme();
  const askConfirm = useConfirm();
  const profile: Profile = data.profile || { name: '', birthdate: '', height: '', weight: '', goals: '', photo: '' };
  const fileRef = useRef<HTMLInputElement | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const setProfile = (patch: Partial<Profile>) => update({ profile: { ...profile, ...patch } });
  const age = ageFrom(profile.birthdate);

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await resizeImage(file, 512, 0.82);
      setProfile({ photo: url });
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ma-discipline-${dateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = async (file: File | undefined) => {
    if (!file) return;
    const ok = await askConfirm({
      title: 'Importer des données',
      message: 'Cela remplacera tes données actuelles par le contenu du fichier. Continuer ?',
      confirmLabel: 'Importer',
    });
    if (!ok) return;
    try {
      const txt = await file.text();
      const obj = JSON.parse(txt) as Partial<AppData>;
      update(obj);
    } catch {
      await askConfirm({
        title: 'Fichier invalide',
        message: "Le fichier n'a pas pu être lu.",
        confirmLabel: 'OK',
        cancelLabel: 'Fermer',
      });
    }
  };

  const fields: [keyof Profile, string, 'numeric'][] = [
    ['height', 'Taille (cm)', 'numeric'],
    ['weight', 'Poids (kg)', 'numeric'],
  ];

  return (
    <div className="px-5 pb-10">
      <div className="text-xs tracking-widest uppercase mb-3 mt-2" style={{ color: C.dim }}>
        Opérateur
      </div>
      <div className="rounded-2xl p-4 mb-5" style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}>
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ background: C.surf2 }}
          >
            {profile.photo ? (
              <img src={profile.photo} alt="" className="w-full h-full object-cover" />
            ) : busy ? (
              <span className="text-xs" style={{ color: C.dim }}>
                …
              </span>
            ) : (
              <Icon name="user" size={28} color={C.dim} />
            )}
          </button>
          <div className="flex-1">
            <input
              value={profile.name}
              onChange={(e) => setProfile({ name: e.target.value })}
              placeholder="Nom / pseudo"
              className="w-full px-3 py-2.5 rounded-xl outline-none text-sm mb-1"
              style={{ background: C.surf2, color: C.text }}
            />
            <button onClick={() => fileRef.current?.click()} className="text-xs" style={{ color: C.gold }}>
              {profile.photo ? 'Changer la photo' : 'Ajouter une photo'}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPhoto(e.target.files?.[0])}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-sm">Date de naissance</span>
          <input
            type="date"
            value={profile.birthdate}
            onChange={(e) => setProfile({ birthdate: e.target.value })}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
          />
        </div>
        {age != null && (
          <div className="text-xs mb-2" style={{ color: C.dim }}>
            {age} ans
          </div>
        )}
        {fields.map(([k, label, mode]) => (
          <div key={k} className="flex items-center justify-between py-2">
            <span className="text-sm">{label}</span>
            <input
              inputMode={mode}
              value={(profile[k] as string) || ''}
              onChange={(e) => setProfile({ [k]: e.target.value } as Partial<Profile>)}
              className="w-24 px-3 py-1.5 rounded-lg text-sm outline-none text-right"
              style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
            />
          </div>
        ))}
        <div className="py-2">
          <span className="text-sm">Objectifs</span>
          <textarea
            value={profile.goals}
            onChange={(e) => setProfile({ goals: e.target.value })}
            rows={2}
            placeholder="Tes objectifs personnels…"
            className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: C.surf2, color: C.text }}
          />
        </div>
      </div>

      <div className="text-xs tracking-widest uppercase mb-3" style={{ color: C.dim }}>
        Sans alcool
      </div>
      <div className="rounded-2xl p-4 mb-5" style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}>
        <div className="text-sm mb-3" style={{ color: C.dim }}>
          Compteur de jours consécutifs sans alcool. Touche « Remettre à zéro » en cas d'écart.
        </div>
        <button
          onClick={async () => {
            const ok = await askConfirm({
              title: 'Remettre à zéro',
              message: 'Le compteur « sans alcool » repart de zéro aujourd\'hui ?',
              confirmLabel: 'Remettre à zéro',
            });
            if (ok) update({ drinkfree: { start: dateKey() } });
          }}
          className="w-full py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: C.surf2, color: C.ember }}
        >
          Remettre le compteur à zéro
        </button>
      </div>

      <div className="text-xs tracking-widest uppercase mb-3" style={{ color: C.dim }}>
        Données
      </div>
      <div className="rounded-2xl p-4" style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}>
        <button
          onClick={exportJSON}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-2"
          style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
        >
          <Icon name="download" size={16} /> Exporter mes données (JSON)
        </button>
        <button
          onClick={() => importRef.current?.click()}
          className="w-full py-3 rounded-xl font-semibold text-sm"
          style={{ background: C.surf2, color: C.dim }}
        >
          Importer depuis un fichier
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => importJSON(e.target.files?.[0])}
        />
        <div className="text-xs mt-3" style={{ color: C.dim }}>
          Tes données sont synchronisées sur ton compte. L'export sert de sauvegarde locale supplémentaire.
        </div>
      </div>
    </div>
  );
}
