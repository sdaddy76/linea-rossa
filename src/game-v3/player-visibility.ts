import {FACTIONS,type Faction} from './catalog-types';
/** The selected/viewed board and route hints never establish ownership. */
export function viewerFaction(profileId:string|undefined,players:readonly {player_id?:string|null;faction:string;is_bot:boolean}[]):Faction|null {
  if(!profileId)return null;
  const seats=players.filter(p=>p.player_id===profileId&&!p.is_bot&&FACTIONS.includes(p.faction as Faction));
  return seats.length===1?seats[0].faction as Faction:null;
}
