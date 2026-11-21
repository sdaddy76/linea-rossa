import { useEffect, useRef, useState } from 'react';
import { PLAYER_AID_URL, PLAYER_AID_WHITE_URL } from './art';

export function PlayerAid({ onClose }: { onClose: () => void }) {
  const [white, setWhite] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopImmediatePropagation(); onClose(); }
      if (event.key === 'Tab') {
        const controls = dialog.current?.querySelectorAll<HTMLElement>('button, a[href], iframe');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', keydown, true);
    return () => { window.removeEventListener('keydown', keydown, true); previous?.focus(); };
  }, [onClose]);
  const url = white ? PLAYER_AID_WHITE_URL : PLAYER_AID_URL;
  return <div ref={dialog} role="dialog" aria-modal="true" aria-label="Aiuto giocatore"
    className="fixed inset-0 z-[70] bg-slate-950 text-slate-100 flex flex-col p-3 md:p-6 gap-3">
    <header className="flex flex-wrap justify-between items-center gap-3">
      <div><h1 className="text-xl font-bold">Aiuto giocatore · fronte e retro</h1><p className="text-sm text-slate-300">Regole rapide e tutte le unità · la partita resta aperta</p></div>
      <button ref={closeButton} onClick={onClose} className="rounded-lg border border-slate-500 px-4 py-2">Torna al gioco</button>
    </header>
    <nav aria-label="Versione aiuto giocatore" className="flex flex-wrap gap-3 items-center text-sm">
      <button aria-pressed={!white} onClick={() => setWhite(false)} className="border rounded-lg px-3 py-2">Versione a colori</button>
      <button aria-pressed={white} onClick={() => setWhite(true)} className="border rounded-lg px-3 py-2">Fondo bianco · stampa</button>
      <a href={url} target="_blank" rel="noreferrer" className="underline text-emerald-300">Apri PDF in una scheda</a>
      <a href={url} download={white ? 'LineaRossa_Aiuto_Giocatore_fondo_bianco.pdf' : 'LineaRossa_Aiuto_Giocatore_fronte_retro.pdf'} className="underline text-emerald-300">Scarica aiuto giocatore</a>
    </nav>
    <p className="text-xs text-slate-400">Se il dispositivo non mostra l’anteprima, usa “Apri PDF” o “Scarica”.</p>
    <iframe key={url} title={white ? 'Aiuto giocatore su fondo bianco' : 'Aiuto giocatore fronte e retro'} src={url}
      className="min-h-0 flex-1 w-full rounded-lg border border-slate-700 bg-white" />
  </div>;
}
