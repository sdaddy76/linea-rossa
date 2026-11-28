/** Partite create con la versione del gioco precedente all'edizione da tavolo: non sono più giocabili. */
export default function LegacyGame({ onBack }: { onBack: () => void }) {
  return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
    <div className="max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4">
      <h1 className="text-xl font-bold">Partita della versione precedente</h1>
      <p className="text-slate-300">Questa partita è stata creata con la prima versione online di Linea Rossa, che non è più disponibile.
        Le nuove partite usano l’edizione da tavolo, con le stesse regole del gioco in scatola.</p>
      <p className="text-slate-400 text-sm">Dalla Sala partite puoi archiviarla per toglierla dall’elenco.</p>
      <button className="rounded-lg border border-slate-500 bg-slate-800 px-4 py-2" onClick={onBack}>Torna alla lobby</button>
    </div>
  </main>;
}
