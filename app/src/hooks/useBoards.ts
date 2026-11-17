import { useCallback, useEffect, useState } from 'react';
import type { Board, Layout, Tile } from '../lib/types';
import { loadBoards, saveBoards, LIMITS } from '../lib/storage';
import { parseLink } from '../lib/embed';

export interface BoardsApi {
  boards: Board[];
  active: Board;
  add: (text: string) => { added: number; rejected: number };
  remove: (tileId: string) => void;
  setLayout: (layout: Layout) => void;
  clear: () => void;
  newBoard: () => void;
}

const uid = () => `t${Math.random().toString(36).slice(2, 8)}`;

export function useBoards(): BoardsApi {
  const [boards, setBoards] = useState<Board[]>(() => loadBoards());
  const [activeId, setActiveId] = useState<string>(() => boards[0]?.id ?? '');

  useEffect(() => {
    if (!boards.some((board) => board.id === activeId) && boards[0]) {
      setActiveId(boards[0].id);
    }
  }, [boards, activeId]);

  useEffect(() => {
    saveBoards(boards, activeId);
  }, [boards, activeId]);

  const empty: Board = { id: 'empty', name: 'Board 1', layout: 4, tiles: [] };
  const active = boards.find((board) => board.id === activeId) ?? boards[0] ?? empty;

  const update = useCallback(
    (mutate: (board: Board) => Board) => {
      setBoards((current) =>
        current.map((board) => (board.id === (active?.id ?? '') ? mutate(board) : board)),
      );
    },
    [active?.id],
  );

  const add = useCallback(
    (text: string) => {
      const parts = text.split(/\s+/).filter(Boolean);
      const parsed = parts.map(parseLink).filter((link) => link !== null);
      const fresh: Tile[] = parsed.map((link) => ({
        id: uid(),
        url: link.url,
        embed: link.embed,
        kind: link.kind,
        name: link.name,
      }));
      /* The updater runs later, so report what the paste contained, not its result. */
      update((board) => {
        const room = Math.max(0, LIMITS.maxTiles - board.tiles.length);
        return { ...board, tiles: [...board.tiles, ...fresh.slice(0, room)] };
      });
      return { added: fresh.length, rejected: parts.length - parsed.length };
    },
    [update],
  );

  const remove = useCallback(
    (tileId: string) => update((board) => ({ ...board, tiles: board.tiles.filter((t) => t.id !== tileId) })),
    [update],
  );

  const setLayout = useCallback(
    (layout: Layout) => update((board) => ({ ...board, layout })),
    [update],
  );

  const clear = useCallback(() => update((board) => ({ ...board, tiles: [] })), [update]);

  const newBoard = useCallback(() => {
    setBoards((current) => {
      const board: Board = {
        id: `b${Math.random().toString(36).slice(2, 8)}`,
        name: `Board ${current.length + 1}`,
        layout: 4,
        tiles: [],
      };
      setActiveId(board.id);
      return [...current, board];
    });
  }, []);

  return { boards, active, add, remove, setLayout, clear, newBoard };
}
