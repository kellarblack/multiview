export type GameState = 'in' | 'pre' | 'post';

export interface TeamSide {
  name: string;
  abbr: string;
  score: string;
  winner: boolean;
  home: boolean;
}

export interface Game {
  id: string;
  league: string;
  state: GameState;
  detail: string;
  away: TeamSide;
  home: TeamSide;
  line: string;
  total: number;
  book: string;
  date: string;
  link: string;
}

export interface Market {
  league: string;
  market: string;
  name: string;
  pct: number;
  url: string;
}

export type Layout = 1 | 2 | 4;

export interface Tile {
  id: string;
  url: string;
  embed: string | null;
  kind: 'youtube' | 'twitch' | 'generic';
  name: string;
}

export interface Board {
  id: string;
  name: string;
  layout: Layout;
  tiles: Tile[];
}

export type View = 'home' | 'wall' | 'sources' | 'discover';
