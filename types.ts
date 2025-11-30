
export enum GameState {
  DEVICE_SELECT,
  MENU,
  PLAYING,
  GAME_OVER,
  VICTORY
}

export interface Position {
  x: number;
  z: number;
}

export interface Room {
  x: number;
  z: number;
  w: number;
  h: number;
}

export interface Door {
  x: number;
  z: number;
  rotation: number;
  isOpen: boolean;
}

export interface MazeGrid {
  width: number;
  height: number;
  cells: number[][]; // 0 = empty, 1 = wall, 2 = start, 3 = exit
  start: Position;
  exit: Position;
  rooms: Room[];
  doors?: Door[];
}

export type Controls = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
}

export interface SoundEvent {
  position: { x: number, z: number };
  type: 'RUN' | 'THROW';
  timestamp: number;
}

export interface ThrowableItem {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  active: boolean;
}