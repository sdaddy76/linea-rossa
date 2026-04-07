// =============================================
// LINEA ROSSA — Pagina Auth (Login / Registrazione)
// Funzionalità: Login, Registrazione, Ricordami, Reset Password
// =============================================
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// URL base per i redirect email — usa sempre l'origin reale (Vercel in prod, localhost in dev)
const REDIRECT_URL = window.location.origin;

interface AuthPageProps {
  onPasswordSaved?: () => void; // callback dopo reset password riuscito
  isRecovery?: boolean;         // true se arriviamo da link reset password
}

export default function AuthPage({ onPasswordSaved, isRecovery }: AuthPageProps = {}) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset' | 'new-password'>('login');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Al mount: pre-compila email se salvata in localStorage (Ricordami)
  useEffect(() => {
    const saved = localStorage.getItem('lr_remember_email');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  // Se isRecovery=true (passato da App.tsx) e non c'è type nell'URL (già pulito),
  // forziamo subito il mode new-password
  useEffect(() => {
    if (isRecovery && mode === 'login') {
      setMode('new-password');
    }
  }, [isRecovery]);

  // Rileva se l'utente arriva da un link di conferma email / reset password
  // Gira sia su hash (#access_token=...&type=recovery) che su query (?type=recovery)
  useEffect(() => {
    const hash   = window.location.hash;
    const search = window.location.search;
    const raw    = hash.startsWith('#') ? hash.slice(1) : search.startsWith('?') ? search.slice(1) : '';
    const params = new URLSearchParams(raw);

    // Errore nel link
    if (params.get('error')) {
      const desc = params.get('error_description') ?? 'Link non valido o scaduto';
      setError(`❌ ${desc.replace(/\+/g, ' ')}`);
      return;
    }

    const type = params.get('type');

    if (type === 'signup') {
      setMessage('✅ Email confermata! Accedi con le tue credenziali.');
      setMode('login');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Intercetta link di reset password: Supabase implicit flow invia
    // #access_token=...&refresh_token=...&type=recovery
    if (type === 'recovery') {
      setMessage('');
      setMode('new-password');
      // NON pulire l'URL qui: App.tsx legge ancora access_token per setSession()
      // window.history.replaceState verrà chiamato da App.tsx dopo setSession()
      return;
    }

    // Fallback: controlla anche il session storage (PKCE / link già processato)
    // Se siamo su view=auth e non c'è type nell'URL, potremmo essere stati portati
    // qui da App.tsx dopo setView('auth') per recovery → imposta new-password
    if (!type && window.location.pathname !== '/' && mode === 'login') {
      // nessuna azione extra
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true); setDebugInfo('');

    try {
      // ── REGISTRAZIONE ────────────────────────────────────────────────
      if (mode === 'register') {
        if (!username.trim()) { setError('Scegli un nome utente'); setLoading(false); return; }
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { username: username.trim() },
            emailRedirectTo: REDIRECT_URL,
          },
        });
        if (signUpError) throw signUpError;
        setMessage('✅ Registrazione completata! Controlla la tua email per confermare.');

      // ── LOGIN ─────────────────────────────────────────────────────────
      } else if (mode === 'login') {
        setDebugInfo('Contattando Supabase...');
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        // Ricordami: salva o rimuovi email da localStorage
        if (rememberMe) {
          localStorage.setItem('lr_remember_email', email);
        } else {
          localStorage.removeItem('lr_remember_email');
        }

      // ── RICHIESTA RESET PASSWORD ─────────────────────────────────────────
      } else if (mode === 'reset') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: REDIRECT_URL,
        });
        if (resetError) throw resetError;
        setMessage('📧 Email inviata! Controlla la tua casella e clicca il link per reimpostare la password.');

      // ── IMPOSTA NUOVA PASSWORD ───────────────────────────────────────────
      } else if (mode === 'new-password') {
        if (newPassword.length < 6) { setError('La password deve essere di almeno 6 caratteri.'); setLoading(false); return; }
        if (newPassword !== newPasswordConfirm) { setError('Le password non coincidono.'); setLoading(false); return; }
        setDebugInfo('Aggiornamento password...');
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) {
          console.error('[reset-password] updateUser error:', updateError);
          // AbortError = lock Supabase occupato → riprova dopo 1s
          if (updateError.message?.includes('aborted') || updateError.name === 'AbortError') {
            setDebugInfo('Riprovo...');
            await new Promise(r => setTimeout(r, 1200));
            const { error: retryErr } = await supabase.auth.updateUser({ password: newPassword });
            if (retryErr) throw retryErr;
          } else {
            throw updateError;
          }
        }
        setDebugInfo('');
        setMessage('✅ Password aggiornata! Ora puoi accedere con la nuova password.');
        setMode('login');
        setNewPassword(''); setNewPasswordConfirm('');
        // Notifica App.tsx che il recovery flow è completato
        if (onPasswordSaved) onPasswordSaved();
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const name = err instanceof Error ? err.name : '';
      // Mappa messaggi Supabase → testo leggibile
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
        setError('❌ Email o password non corretti.');
      } else if (msg.includes('New password should be different') || msg.includes('different from the old')) {
        setError('⚠️ La nuova password deve essere diversa da quella attuale. Scegli una password diversa.');
      } else if (msg.includes('Email not confirmed')) {
        setError('📧 Devi confermare la tua email. Controlla la casella di posta.');
      } else if (msg.includes('User already registered')) {
        setError('⚠️ Email già registrata. Prova ad accedere.');
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setError('🌐 Errore di rete. Controlla la connessione e riprova.');
      } else if (name === 'AbortError' || msg.includes('aborted') || msg.includes('Lock broken')) {
        if (mode === 'new-password') {
          setError('⏱️ Errore temporaneo. Riprova a cliccare "Salva nuova password".');
        } else {
          setError('⏱️ Richiesta interrotta. Riprova tra qualche secondo.');
        }
      } else {
        setError(`⚠️ ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Reinvia email di conferma ──────────────────────────────────────────────
  const handleResendConfirmation = async () => {
    if (!email) { setError('Inserisci la tua email prima di reinviare.'); return; }
    setResendLoading(true); setError(''); setMessage('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: REDIRECT_URL },
      });
      if (error) throw error;
      setMessage('📧 Email di conferma inviata! Controlla la casella di posta e clicca il link.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore invio email');
    } finally {
      setResendLoading(false);
    }
  };

  // Etichette dinamiche in base alla modalità
  const TAB_LABEL: Record<typeof mode, string> = {
    login:          '🔐 ACCEDI',
    register:       '📋 REGISTRATI',
    reset:          '🔑 RESET',
    'new-password': '🔑 NUOVA PASSWORD',
  };
  const SUBMIT_LABEL: Record<typeof mode, string> = {
    login:          '🚀 ENTRA',
    register:       '✅ CREA ACCOUNT',
    reset:          '📧 INVIA EMAIL RESET',
    'new-password': '🔒 SALVA NUOVA PASSWORD',
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☢️</div>
          <h1 className="text-3xl font-bold text-[#00ff88] font-mono tracking-widest">LINEA ROSSA</h1>
          <p className="text-[#8899aa] text-sm mt-1 font-mono">CRISIS TRACKER — ONLINE MULTIPLAYER</p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl p-6 shadow-2xl shadow-[#00ff8820]">

          {/* Tab switcher — mostra solo login/registrati */}
          {mode !== 'reset' && mode !== 'new-password' && (
            <div className="flex mb-6 bg-[#0a0e1a] rounded-lg p-1">
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setMessage(''); }}
                  className={`flex-1 py-2 rounded-md text-sm font-mono font-bold transition-all ${
                    mode === m
                      ? 'bg-[#00ff88] text-[#0a0e1a]'
                      : 'text-[#8899aa] hover:text-white'
                  }`}>
                  {TAB_LABEL[m]}
                </button>
              ))}
            </div>
          )}

          {/* Titolo per modalità reset */}
          {mode === 'reset' && (
            <div className="mb-6 text-center">
              <p className="text-[#00ff88] font-mono font-bold text-sm tracking-widest">🔑 REIMPOSTA PASSWORD</p>
              <p className="text-[#8899aa] text-xs font-mono mt-1">Inserisci la tua email per ricevere il link di reset</p>
            </div>
          )}

          {/* Titolo per modalità nuova password */}
          {mode === 'new-password' && (
            <div className="mb-6 text-center">
              <p className="text-[#00ff88] font-mono font-bold text-sm tracking-widest">🔒 NUOVA PASSWORD</p>
              <p className="text-[#8899aa] text-xs font-mono mt-1">Scegli la tua nuova password di accesso</p>
            </div>
          )}

          {/* Banner configurazione Supabase mancante */}
          {typeof import.meta !== 'undefined' &&
            (import.meta as Record<string,Record<string,string>>).env?.VITE_SUPABASE_URL?.includes('placeholder') && (
            <div className="mb-4 bg-yellow-900/30 border border-yellow-500 rounded-lg p-3 text-yellow-300 text-xs font-mono">
              ⚠️ Supabase non configurato. Imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY su Vercel.
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-4">

            {/* Campo username (solo registrazione) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-mono text-[#8899aa] mb-1">NOME UTENTE</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="es. Comandante_77"
                  autoComplete="username"
                  maxLength={20}
                  className="w-full bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                    text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]
                    placeholder-[#334455] transition-colors"
                />
              </div>
            )}

            {/* Campo email */}
            <div>
              <label className="block text-xs font-mono text-[#8899aa] mb-1">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@esempio.com"
                autoComplete="email"
                required
                className="w-full bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                  text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]
                  placeholder-[#334455] transition-colors"
              />
            </div>

            {/* Campo password (solo login e registrazione) */}
            {(mode === 'login' || mode === 'register') && (
              <div>
                <label className="block text-xs font-mono text-[#8899aa] mb-1">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                    text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]
                    placeholder-[#334455] transition-colors"
                />
              </div>
            )}

            {/* Campi nuova password */}
            {mode === 'new-password' && (
              <>
                <div>
                  <label className="block text-xs font-mono text-[#8899aa] mb-1">NUOVA PASSWORD</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="min. 6 caratteri"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                      text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]
                      placeholder-[#334455] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8899aa] mb-1">CONFERMA PASSWORD</label>
                  <input
                    type="password"
                    value={newPasswordConfirm}
                    onChange={e => setNewPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                      text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]
                      placeholder-[#334455] transition-colors"
                  />
                </div>
              </>
            )}

            {/* ── Riga "Ricordami" + "Password dimenticata" (solo login) ── */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                {/* Checkbox Ricordami */}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => setRememberMe(v => !v)}
                    className={`w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer
                      ${rememberMe
                        ? 'bg-[#00ff88] border-[#00ff88]'
                        : 'bg-[#0a0e1a] border-[#334455] group-hover:border-[#00ff88]'
                      }`}>
                    {rememberMe && (
                      <svg className="w-3 h-3 text-[#0a0e1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[#8899aa] group-hover:text-white transition-colors select-none">
                    Ricordami
                  </span>
                </label>

                {/* Link Reset Password */}
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(''); setMessage(''); }}
                  className="text-xs font-mono text-[#4488cc] hover:text-[#00ff88] transition-colors underline underline-offset-2">
                  Password dimenticata?
                </button>
              </div>
            )}

            {/* Messaggi errore / successo */}
            {error && (
              <div className="bg-[#ff000015] border border-[#ff4444] rounded-lg p-3 text-[#ff6666] text-xs font-mono">
                ⚠️ {error}
              </div>
            )}
            {message && (
              <div className="bg-[#00ff8815] border border-[#00ff88] rounded-lg p-3 text-[#00ff88] text-xs font-mono">
                {message}
              </div>
            )}

            {/* Debug info */}
            {debugInfo && (
              <div className="text-xs font-mono text-[#4488cc] bg-[#0a1628] border border-[#1e3a5f] rounded p-2">
                ℹ️ {debugInfo}
              </div>
            )}
            <div className="text-xs font-mono text-[#2a4060] text-center">
              URL: {import.meta.env.VITE_SUPABASE_URL?.slice(0,40) || '❌ NON CONFIGURATO'}
            </div>

            {/* Reinvia email conferma — visibile solo se errore email non confermata */}
            {mode === 'login' && error.includes('confermare') && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="w-full py-2.5 border border-[#4488cc] hover:border-[#00ff88]
                  text-[#4488cc] hover:text-[#00ff88] font-mono text-xs rounded-lg
                  transition-all disabled:opacity-50">
                {resendLoading ? '⏳ Invio...' : '📧 Reinvia email di conferma'}
              </button>
            )}

            {/* Pulsante submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50
                text-[#0a0e1a] font-bold font-mono rounded-lg transition-all
                shadow-lg shadow-[#00ff8840] text-sm tracking-widest">
              {loading ? '⏳ ...' : SUBMIT_LABEL[mode]}
            </button>

            {/* Torna al login (da reset o new-password) */}
            {(mode === 'reset' || mode === 'new-password') && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                className="w-full py-2 text-xs font-mono text-[#8899aa] hover:text-white transition-colors">
                ← Torna al login
              </button>
            )}

          </form>
        </div>

        <p className="text-center text-[#334455] text-xs font-mono mt-4">
          Linea Rossa — Gioco di simulazione geopolitica
        </p>
      </div>
    </div>
  );
}
