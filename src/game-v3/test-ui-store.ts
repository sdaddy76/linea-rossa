import { createGame, type EngineState } from './engine';
import type { Faction } from './catalog-types';
const state = createGame({ bots: [] }, () => 0.3);
export const uiFixture: {
  state: EngineState; own: Faction | null; member: boolean;
} = { state, own: 'Iran', member: true };
export function useOnlineGameStore() {
  return {
    game: { id: 'game', created_by: 'host' },
    gameState: { special_uses: { tabletop_v3: { revision: 0, state: uiFixture.state } } },
    myFaction: uiFixture.own, profile: { id: 'host' },
    players: uiFixture.member ? [{ player_id: 'host', faction: uiFixture.own, is_bot: false }] : [],
  };
}
