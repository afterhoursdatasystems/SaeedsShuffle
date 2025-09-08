export type Player = {
  id: string;
  name: string;
  skill: 'Beginner' | 'Intermediate' | 'Advanced';
  gender: 'Male' | 'Female' | 'Other';
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
