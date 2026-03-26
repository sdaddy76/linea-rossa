// =============================================
// LINEA ROSSA — Pagina Auth (Login / Registrazione)
// =============================================
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      if (mode === 'register') {
        if (!username.trim()) { setError('Scegli un nome utente'); setLoading(false); return; }
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { username: username.trim() } },
        });
        if (signUpError) throw signUpError;
        setMessage('✅ Registrazione completata! Controlla la tua email per confermare.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
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
          {/* Tab switcher */}
          <div className="flex mb-6 bg-[#0a0e1a] rounded-lg p-1">
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-md text-sm font-mono font-bold transition-all ${
                  mode === m
                    ? 'bg-[#00ff88] text-[#0a0e1a]'
                    : 'text-[#8899aa] hover:text-white'
                }`}>
                {m === 'login' ? '🔐 ACCEDI' : '📋 REGISTRATI'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-mono text-[#8899aa] mb-1">NOME UTENTE</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="es. Comandante_77"
                  maxLength={20}
                  className="w-full bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                    text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]
                    placeholder-[#334455] transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-mono text-[#8899aa] mb-1">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@esempio.com"
                required
                className="w-full bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                  text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]
                  placeholder-[#334455] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#8899aa] mb-1">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg px-4 py-2.5
                  text-white font-mono text-sm focus:outline-none focus:border-[#00ff88]
                  placeholder-[#334455] transition-colors"
              />
            </div>

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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-50
                text-[#0a0e1a] font-bold font-mono rounded-lg transition-all
                shadow-lg shadow-[#00ff8840] text-sm tracking-widest">
              {loading ? '⏳ ...' : mode === 'login' ? '🚀 ENTRA' : '✅ CREA ACCOUNT'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#334455] text-xs font-mono mt-4">
          Linea Rossa — Gioco di simulazione geopolitica
        </p>
      </div>
    </div>
  );
}
