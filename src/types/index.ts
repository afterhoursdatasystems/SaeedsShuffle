

export type Player = {
  id: string;
  name: string;
  skill: number;
  gender: 'Guy' | 'Gal';
  present: boolean;
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
  level?: number;
};

export type Match = {
  id: string;
  teamA: string;
  teamB: string;
  resultA: number | null;
  resultB: number | null;
  court: string;
  time: string;
};

export type GameFormat = 
  | 'round-robin' 
  | 'pool-play-bracket' 
  | 'king-of-the-court'
  | 'level-up'
  | 'blind-draw';

export type GameVariant = 
  | 'standard'
  | 'monarch-of-the-court'
  | 'king-s-ransom'
  | 'power-up-round';


export type PowerUp = {
  name: string;
  description: string;
};
