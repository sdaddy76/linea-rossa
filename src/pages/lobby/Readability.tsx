import { useEffect, useState, type ReactNode } from 'react';
import { Sun, Type } from 'lucide-react';
import './readability.css';

export const READABILITY_KEY = 'linea_rossa_readability';
export const READABLE_PALETTE = {
  background: '#f3f6fb', surface: '#ffffff', inset: '#edf2f8',
  text: '#162437', muted: '#425466', border: '#8190a3',
  primary: '#006747', onPrimary: '#ffffff', cyan: '#075a70',
  purple: '#5b21a8', danger: '#a51c30', warning: '#784400',
};
function browserStorage() {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; }
  catch { return undefined; }
}

export function readPreference(storage?: Pick<Storage, 'getItem'>, defaultHigh = false) {
  try {
    const value = storage?.getItem(READABILITY_KEY);
    return value === 'high' || (value == null && defaultHigh);
  }
  catch { return defaultHigh; }
}
export function savePreference(high: boolean, storage?: Pick<Storage, 'setItem'>) {
  try { storage?.setItem(READABILITY_KEY, high ? 'high' : 'standard'); }
  catch { /* Private browsing/storage restrictions must not disable the control. */ }
}
export function useReadability(defaultHigh = false) {
  const [high, setHigh] = useState(() => readPreference(browserStorage(), defaultHigh));
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === READABILITY_KEY || event.key === null) setHigh(readPreference(browserStorage(), defaultHigh));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [defaultHigh]);
  const toggle = () => {
    const next = !high;
    setHigh(next);
    savePreference(next, browserStorage());
  };
  return { high, toggle };
}

export function ReadabilityFrame({ high, onToggle, children }: {
  high: boolean; onToggle: () => void; children: ReactNode;
}) {
  return <div className="lobby-ui" data-readability={high ? 'high' : 'standard'}>
    <div className="readability-toolbar">
      <div><strong><Type size={20} aria-hidden="true"/> Leggibilità</strong>
        <p id="readability-description">{high ? 'Tema chiaro · caratteri grandi · contrasto elevato' : 'Attiva il tema chiaro con caratteri più grandi'}</p></div>
      <button type="button" aria-pressed={high} aria-describedby="readability-description" onClick={onToggle}>
        <Sun size={20} aria-hidden="true"/>{high ? 'Alta leggibilità: attiva' : 'Alta leggibilità'}
      </button>
    </div>
    {children}
  </div>;
}
