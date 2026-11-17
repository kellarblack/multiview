import type { Board, Layout, Tile } from './types';
import { parseLink } from './embed';

const KEY = 'multiview.react.v1';
const MAX_TILES = 4;
const LAYOUTS: Layout[] = [1, 2, 4];

const makeBoard = (name = 'Board 1'): Board => ({
  id: `b${Math.random().toString(36).slice(2, 8)}`,
  name,
  layout: 4,
  tiles: [],
});

const clampLayout = (value: unknown): Layout =>
  LAYOUTS.includes(Number(value) as Layout) ? (Number(value) as Layout) : 4;

const safeTile = (raw: unknown): Tile | null => {
  if (!raw || typeof raw !== 'object') return null;
  const tile = raw as Partial<Tile>;
  if (typeof tile.url !== 'string') return null;
  const parsed = parseLink(tile.url);
  if (!parsed) return null;
  return {
    id: typeof tile.id === 'string' ? tile.id : `t${Math.random().toString(36).slice(2, 8)}`,
    url: parsed.url,
    embed: parsed.embed,
    kind: parsed.kind,
    name: typeof tile.name === 'string' && tile.name ? tile.name : parsed.name,
  };
};

export function loadBoards(): Board[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '') as { boards?: unknown; activeId?: unknown };
    const boards = (Array.isArray(parsed.boards) ? parsed.boards : [])
      .map((raw) => {
        if (!raw || typeof raw !== 'object') return null;
        const board = raw as Partial<Board>;
        const tiles = (Array.isArray(board.tiles) ? board.tiles : [])
          .map(safeTile)
          .filter((tile): tile is Tile => tile !== null)
          .slice(0, MAX_TILES);
        return {
          id: typeof board.id === 'string' ? board.id : makeBoard().id,
          name: typeof board.name === 'string' && board.name ? board.name : 'Board',
          layout: clampLayout(board.layout),
          tiles,
        } satisfies Board;
      })
      .filter((board): board is Board => board !== null);
    if (boards.length) return boards;
  } catch {
    /* first run, or cleared storage */
  }
  return [makeBoard()];
}

export function saveBoards(boards: Board[], activeId: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ boards, activeId }));
  } catch {
    /* private mode: the session still works */
  }
}

export const LIMITS = { maxTiles: MAX_TILES, layouts: LAYOUTS };
