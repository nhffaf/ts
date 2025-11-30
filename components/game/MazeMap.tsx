
import React, { useMemo, useEffect } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { DoubleSide, TextureLoader, RepeatWrapping, Vector3 } from 'three';
import { useLoader } from '@react-three/fiber';
import { CELL_SIZE, WALL_HEIGHT, BED_SPAWN_CHANCE, TABLE_SPAWN_CHANCE } from '../../constants';
import { MazeGrid } from '../../types';

interface MazeMapProps {
  maze: MazeGrid;
  setBeds?: (beds: Vector3[]) => void;
  setTables?: (tables: Vector3[]) => void;
}

const MazeMap: React.FC<MazeMapProps> = ({ maze, setBeds, setTables }) => {
  const floorTexture = useLoader(TextureLoader, "https://raw.githubusercontent.com/nhffaf/tx/refs/heads/main/floor1.png");
  const wallTexture = useLoader(TextureLoader, "https://raw.githubusercontent.com/nhffaf/tx/refs/heads/main/brick1.png");

  useEffect(() => {
    floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
    floorTexture.repeat.set(maze.width, maze.height);

    wallTexture.wrapS = wallTexture.wrapT = RepeatWrapping;
    wallTexture.repeat.set(2.5, 2.5);
  }, [floorTexture, wallTexture, maze.width, maze.height]);

  const walls = useMemo(() => {
    const w: { x: number; z: number }[] = [];
    maze.cells.forEach((row, z) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          w.push({ x: x * CELL_SIZE, z: z * CELL_SIZE });
        }
      });
    });
    return w;
  }, [maze]);

  const lamps = useMemo(() => {
    const l: { x: number; z: number }[] = [];
    maze.cells.forEach((row, z) => {
      row.forEach((cell, x) => {
        // Chance of a lamp in an empty cell
        if (cell === 0 && !(x === maze.start.x && z === maze.start.z) && Math.random() < 0.1) {
          l.push({ x: x * CELL_SIZE, z: z * CELL_SIZE });
        }
      });
    });
    return l;
  }, [maze]);

  // Generate furniture based on rooms
  useEffect(() => {
      const b: Vector3[] = [];
      const t: Vector3[] = [];

      maze.rooms.forEach(room => {
          // Center of room in world coords
          const cx = (room.x + room.w / 2) * CELL_SIZE;
          const cz = (room.z + room.h / 2) * CELL_SIZE;

          // Random chance for bed
          if (Math.random() < BED_SPAWN_CHANCE) {
            // Try to place in corner
            const bedX = (room.x + 1) * CELL_SIZE;
            const bedZ = (room.z + 1) * CELL_SIZE;
            b.push(new Vector3(bedX, 0, bedZ));
          }

          // Random chance for table
          if (Math.random() < TABLE_SPAWN_CHANCE && room.w >= 3 && room.h >= 3) {
              t.push(new Vector3(cx, 0, cz));
          }
      });

      if (setBeds) setBeds(b);
      if (setTables) setTables(t);
  }, [maze, setBeds, setTables]);

  const floorSize = Math.max(maze.width, maze.height) * CELL_SIZE;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[floorSize / 2 - CELL_SIZE, 0, floorSize / 2 - CELL_SIZE]}>
        <planeGeometry args={[floorSize * 2, floorSize * 2]} />
        <meshStandardMaterial map={floorTexture} roughness={0.8} />
      </mesh>
      
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[floorSize / 2 - CELL_SIZE, WALL_HEIGHT, floorSize / 2 - CELL_SIZE]}>
        <planeGeometry args={[floorSize * 2, floorSize * 2]} />
        <meshStandardMaterial color="#050505" side={DoubleSide} />
      </mesh>

      {/* Walls Instanced for Performance */}
      <Instances range={walls.length} position={[0, WALL_HEIGHT / 2, 0]}>
        <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
        <meshStandardMaterial map={wallTexture} roughness={0.9} />
        {walls.map((pos, i) => (
          <Instance key={i} position={[pos.x, 0, pos.z]} />
        ))}
      </Instances>

      {/* Lamps */}
      {lamps.map((pos, i) => (
        <group key={`lamp-${i}`} position={[pos.x, WALL_HEIGHT - 0.2, pos.z]}>
            <mesh>
                <boxGeometry args={[0.6, 0.2, 0.6]} />
                <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={3} />
            </mesh>
            <pointLight 
                color="#ffaa00" 
                intensity={12} 
                distance={18} 
                decay={2} 
            />
        </group>
      ))}

      {/* Exit Marker */}
      <mesh position={[maze.exit.x * CELL_SIZE, 1, maze.exit.z * CELL_SIZE]}>
         <boxGeometry args={[1, 2, 1]} />
         <meshBasicMaterial color="green" wireframe />
      </mesh>
      <pointLight position={[maze.exit.x * CELL_SIZE, 2, maze.exit.z * CELL_SIZE]} color="green" intensity={2} distance={10} />

    </group>
  );
};

export default MazeMap;
