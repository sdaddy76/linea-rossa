import React from 'react';

interface Props {
  sanzioniDelta: number;
  cardName: string;
  vetiRimasti: number;
  onDecide: (use: boolean) => void;
}

export default function VetoModal({ sanzioniDelta, cardName, vetiRimasti, onDecide }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{backgroundColor:'#00000088', backdropFilter:'blur(4px)'}}>
      <div className="bg-[#0d1220] border-2 border-[#fbbf24] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🏛️</div>
          <h2 className="text-[#fbbf24] font-bold text-lg">VETO ONU — Russia</h2>
          <p className="text-[#8899aa] text-sm mt-1">Veti rimasti: {vetiRimasti}</p>
        </div>
        <div className="bg-[#1a2030] rounded-xl p-3 mb-4 text-center">
          <p className="text-white text-sm">La carta <b>"{cardName}"</b> aumenta le sanzioni di</p>
          <p className="text-[#ef4444] font-bold text-xl mt-1">🔒 +{sanzioniDelta}</p>
        </div>
        <p className="text-[#8899aa] text-sm text-center mb-5">
          Vuoi usare un veto ONU per annullare questo aumento?<br/>
          <span className="text-[#fbbf24]">Il veto sarà consumato permanentemente.</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onDecide(true)}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#fbbf24] text-[#0d1220] hover:bg-[#f59e0b] transition-colors"
          >
            🏛️ USA VETO
          </button>
          <button
            onClick={() => onDecide(false)}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#1e3a5f] text-white border border-[#2d4a6f] hover:bg-[#2d4a7a] transition-colors"
          >
            ✗ Non usare
          </button>
        </div>
      </div>
    </div>
  );
}
