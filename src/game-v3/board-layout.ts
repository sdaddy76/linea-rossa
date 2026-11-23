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

// Measured on the supplied 3072 × 2048 artwork. The perimeter is not a
// uniform grid: its first six top cells are wider than the later cells.
const TOP_CENTRES = [298,413,527,642,758,872,984,1093,1203,1312,1423,1532,1641,1751,1861,1969,2077,2184,2292,2396,2502,2608,2716,2829,2942];
const BOTTOM_CENTRES = [2884,2772,2658,2543,2432,2320,2208,2098,1985,1870,1754,1642,1528,1414,1300,1186,1072,958,843,728,617,509,400,291,179];
const percent = (x:number,y:number) => ({x:x/3072*100,y:y/2048*100});
/** Same printed cell for a PV marker and the turn marker at the same value. */
export function perimeterPoint(value:number) {
  const n=Math.min(100,Math.max(0,Math.floor(value)));
  if(n===0)return percent(105,67);
  if(n<=25)return percent(TOP_CENTRES[n-1],66);
  if(n<=50)return percent(2986,173+(n-26)*71.15);
  if(n<=75)return percent(BOTTOM_CENTRES[n-51],1981);
  return percent(88.5,1880.6-(n-76)*71.15);
}
export function globalTrackPoint(track:'Nucleare'|'Sanzioni'|'Crisi Bellica'|'Opinione',value:number) {
  if(track==='Nucleare')return percent(250.5,1530-(value-1)*73.4);
  if(track==='Sanzioni')return percent(2637,1056-(value-1)*61.5);
  if(track==='Crisi Bellica')return percent(2637,1253+(value-1)*53.7);
  return percent(584+(value+10)*108.3,1843);
}
