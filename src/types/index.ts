export type Player = {
  id: string;
  name: string;
  skill: number;
  gender: 'Guy' | 'Gal';
  present: boolean;
};

export type Team = {
  name: string;
  players: Player[];
};

export type Match = {
  id: string;
  teamA: string;
  teamB: string;
  resultA: number | null;
  resultB: number | null;
  court: string;
};
