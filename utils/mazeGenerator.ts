
import { MazeGrid, Position, Room } from '../types';

export const generateMaze = (width: number, height: number): MazeGrid => {
  // Ensure odd dimensions
  const w = width % 2 === 0 ? width + 1 : width;
  const h = height % 2 === 0 ? height + 1 : height;

  const cells = Array(h).fill(null).map(() => Array(w).fill(1)); // Fill with walls
  
  const directions = [
    { dx: 0, dy: -2 }, // North
    { dx: 0, dy: 2 },  // South
    { dx: 2, dy: 0 },  // East
    { dx: -2, dy: 0 }  // West
  ];

  const shuffle = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const carved = new Set<string>();
  const stack: Position[] = [];

  const start: Position = { x: 1, z: 1 };
  cells[start.z][start.x] = 0;
  stack.push(start);
  carved.add(`${start.x},${start.z}`);

  // 1. Generate Corridors (Recursive Backtracker)
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = [];

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const nz = current.z + dir.dy;

      if (nx > 0 && nx < w - 1 && nz > 0 && nz < h - 1 && !carved.has(`${nx},${nz}`)) {
        neighbors.push({ x: nx, z: nz, dx: dir.dx, dy: dir.dy });
      }
    }

    if (neighbors.length > 0) {
      const chosen = shuffle(neighbors)[0];
      // Carve wall between
      cells[current.z + chosen.dy / 2][current.x + chosen.dx / 2] = 0;
      // Carve destination
      cells[chosen.z][chosen.x] = 0;
      carved.add(`${chosen.x},${chosen.z}`);
      stack.push({ x: chosen.x, z: chosen.z });
    } else {
      stack.pop();
    }
  }

  // 2. Carve Open Rooms (Simple open spaces)
  const rooms: Room[] = [];
  const numRooms = Math.floor(w / 4);

  for (let i = 0; i < numRooms; i++) {
      // Random size 3x3 to 5x5
      const rw = Math.floor(Math.random() * 2) + 3; 
      const rh = Math.floor(Math.random() * 2) + 3;
      
      // Random position (ensure borders)
      const rx = Math.floor(Math.random() * (w - rw - 2)) + 1;
      const rz = Math.floor(Math.random() * (h - rh - 2)) + 1;

      rooms.push({ x: rx, z: rz, w: rw, h: rh });

      // Carve interior
      for (let y = rz; y < rz + rh; y++) {
          for (let x = rx; x < rx + rw; x++) {
              if (y > 0 && y < h-1 && x > 0 && x < w-1) {
                cells[y][x] = 0; 
                carved.add(`${x},${y}`);
              }
          }
      }
  }

  // Set start
  cells[start.z][start.x] = 2;

  // Set exit at the furthest point (bottom right-ish)
  let exitFound = false;
  let exit: Position = { x: w - 2, z: h - 2 };
  
  // Simple search for empty spot near bottom right
  for(let z = h - 2; z > 0; z--) {
      for(let x = w - 2; x > 0; x--) {
          if (cells[z][x] === 0) {
              cells[z][x] = 3;
              exit = {x, z};
              exitFound = true;
              break;
          }
      }
      if(exitFound) break;
  }

  return { width: w, height: h, cells, start, exit, rooms };
};
