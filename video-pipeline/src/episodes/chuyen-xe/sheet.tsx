import React from 'react';
import { CharacterSheet, CHARACTERS, ShotFrame } from '../../engine';

/** A one-frame composition for the character gate: hold this next to the reference before any shot. */
export const HungSheet: React.FC = () => (
  <ShotFrame>
    <rect x={420} y={-420} width={1080} height={1920} fill="#14171C" />
    <CharacterSheet spec={CHARACTERS.hung} t={0} />
  </ShotFrame>
);
