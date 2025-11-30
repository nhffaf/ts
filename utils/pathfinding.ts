import { MazeGrid, Position } from '../types';

interface Node {
  x: number;
  z: number;
  f: number;
  g: number;
  h: number;
  parent: Node | null;
}

export const findPath = (maze: MazeGrid, start: Position, end: Position): Position[] => {
  const openList: Node[] = [];
  const closedList: Set<string> = new Set();
  
  const startNode: Node = { ...start, f: 0, g: 0, h: 0, parent: null };
  openList.push(startNode);

  while (openList.length > 0) {
    // Sort by lowest f score
    openList.sort((a, b) => a.f - b.f);
    const currentNode = openList.shift()!;
    const currentKey = `${currentNode.x},${currentNode.z}`;

    if (currentNode.x === end.x && currentNode.z === end.z) {
      const path: Position[] = [];
      let curr: Node | null = currentNode;
      while (curr) {
        path.push({ x: curr.x, z: curr.z });
        curr = curr.parent;
      }
      return path.reverse();
    }

    closedList.add(currentKey);

    const neighbors = [
      { x: currentNode.x + 1, z: currentNode.z },
      { x: currentNode.x - 1, z: currentNode.z },
      { x: currentNode.x, z: currentNode.z + 1 },
      { x: currentNode.x, z: currentNode.z - 1 },
    ];

    for (const neighbor of neighbors) {
      if (
        neighbor.x < 0 || neighbor.x >= maze.width ||
        neighbor.z < 0 || neighbor.z >= maze.height ||
        maze.cells[neighbor.z][neighbor.x] === 1 // Wall check
      ) {
        continue;
      }

      if (closedList.has(`${neighbor.x},${neighbor.z}`)) continue;

      const gScore = currentNode.g + 1;
      const hScore = Math.abs(neighbor.x - end.x) + Math.abs(neighbor.z - end.z); // Manhattan
      const fScore = gScore + hScore;

      const existingNode = openList.find(n => n.x === neighbor.x && n.z === neighbor.z);
      
      if (existingNode) {
        if (gScore < existingNode.g) {
          existingNode.g = gScore;
          existingNode.f = fScore;
          existingNode.parent = currentNode;
        }
      } else {
        openList.push({
          x: neighbor.x,
          z: neighbor.z,
          g: gScore,
          h: hScore,
          f: fScore,
          parent: currentNode
        });
      }
    }
  }

  return []; // No path found
};