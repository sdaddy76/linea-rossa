import type { CardEffects } from '../src/types/game';

// Negative compile-time tests: the contract must remain closed and numeric.
// @ts-expect-error A typo must never become an executable card track.
const unknownTrack: CardEffects = { forze_militar_iran: (value: number) => value };
// @ts-expect-error Effect callbacks must return a numeric delta.
const wrongDelta: CardEffects = { forze_militari_iran: (value: number) => value > 0 };

const validEffect: CardEffects = { forze_militari_iran: value => value <= 7 ? 2 : 1 };
void unknownTrack;
void wrongDelta;
void validEffect;
