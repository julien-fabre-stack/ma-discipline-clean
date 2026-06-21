import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useTheme } from '@/shared/theme/ThemeProvider';

type Mode = 'login' | 'signup';

export function Login() {
  const { C, dawn, glowShadow } = useTheme();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  const go = async () => {
    setErr('');
    setInfo('');
    if (!auth) return;
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, pw);
      } else {
        await createUserWithEmailAndPassword(auth, email, pw);
      }
    } catch (e) {
      setErr((e as Error).message.replace('Firebase:', '').trim());
    }
  };

  const reset = async () => {
    setErr('');
    setInfo('');
    if (!email.trim()) {
      setErr('Saisis ton email ci-dessus, puis touche « Mot de passe oublié »');
      return;
    }
    if (!auth) return;
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Email de réinitialisation envoyé si ce compte existe.');
    } catch (e) {
      setErr((e as Error).message.replace('Firebase:', '').trim());
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: C.night, color: C.text }}
    >
      <div
        className="text-4xl font-extrabold mb-1"
        style={{ background: dawn, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
      >
        Ma Discipline
      </div>
      <div className="text-sm mb-8" style={{ color: C.dim }}>
        {mode === 'login' ? 'Connecte-toi' : 'Crée ton compte (une seule fois)'}
      </div>
      <div className="w-full max-w-xs">
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl mb-3 outline-none"
          style={{ background: C.surf, color: C.text, border: `1px solid ${C.line}` }}
        />
        <input
          placeholder="Mot de passe"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go()}
          className="w-full px-4 py-3 rounded-xl mb-3 outline-none"
          style={{ background: C.surf, color: C.text, border: `1px solid ${C.line}` }}
        />
        {err && (
          <div className="text-xs mb-3" style={{ color: C.ember }}>
            {err}
          </div>
        )}
        {info && (
          <div className="text-xs mb-3" style={{ color: C.ok }}>
            {info}
          </div>
        )}
        <button
          onClick={go}
          className="w-full py-3.5 rounded-2xl font-bold mb-3"
          style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
        >
          {mode === 'login' ? 'Se connecter' : 'Créer le compte'}
        </button>
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setErr('');
            setInfo('');
          }}
          className="w-full text-sm mb-2"
          style={{ color: C.dim }}
        >
          {mode === 'login' ? 'Première fois ? Créer un compte' : "J'ai déjà un compte"}
        </button>
        {mode === 'login' && (
          <button onClick={reset} className="w-full text-sm" style={{ color: C.gold }}>
            Mot de passe oublié ?
          </button>
        )}
      </div>
    </div>
  );
}
