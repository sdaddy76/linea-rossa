// Centres of the printed deployment squares in the original 1920 × 1280 board.
// Coordinates stay relative to the artwork so zoom cannot detach a unit from
// its territory. Capacity remains owned by the rules catalog.
export const TERRITORY_LAYOUT: Record<string, { x: number; y: number; step: number }> = {
  turchia: { x: 26.93, y: 22.97, step: 1.81 },
  siria: { x: 38.02, y: 32.81, step: 1.59 },
  libano: { x: 28.54, y: 35.63, step: 1.58 },
  israele: { x: 28.23, y: 44.61, step: 1.51 },
  giordania: { x: 39.06, y: 42.89, step: 1.77 },
  egitto: { x: 22.86, y: 55.39, step: 1.72 },
  iraq: { x: 52.97, y: 34.61, step: 1.74 },
  iran: { x: 67.4, y: 31.09, step: 1.57 },
  kuwait: { x: 61.04, y: 45.39, step: 1.77 },
  bahrein: { x: 63.96, y: 53.13, step: 1.77 },
  qatar: { x: 70.05, y: 58.44, step: 1.77 },
  emirati: { x: 67.5, y: 66.41, step: 1.77 },
  oman: { x: 78.44, y: 70.39, step: 1.77 },
  'arabia-saudita': { x: 45.52, y: 55, step: 1.77 },
  hormuz: { x: 75.57, y: 53.28, step: 1.93 },
  yemen: { x: 59.64, y: 75.31, step: 1.75 },
};

export function territorySlot(territory: string, index: number) {
  const layout = TERRITORY_LAYOUT[territory];
  if (!layout) throw new Error(`Territorio senza coordinate sulla mappa: ${territory}`);
  return { x: layout.x + index * layout.step, y: layout.y };
}
