
import React, { useState, useCallback } from 'react';
import { Vector3 } from 'three';
import { MazeGrid, SoundEvent, ThrowableItem } from '../../types';
import MazeMap from './MazeMap';
import Player from './Player';
import Granny from './Granny';
import { Furnishings } from './Furnishings';

interface SceneProps {
  maze: MazeGrid;
  onGameOver: () => void;
  onVictory: () => void;
  gameActive: boolean;
  setTaunt: (t: string) => void;
  isMobile: boolean;
}

const Scene: React.FC<SceneProps> = ({ maze, onGameOver, onVictory, gameActive, setTaunt, isMobile }) => {
  const [playerPos, setPlayerPos] = useState<Vector3>(new Vector3(0, 0, 0));
  const [beds, setBeds] = useState<Vector3[]>([]);
  const [tables, setTables] = useState<Vector3[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [lastSound, setLastSound] = useState<SoundEvent | null>(null);
  const [throwables, setThrowables] = useState<ThrowableItem[]>([]);

  // Callback when something makes noise (Player running, Object falling)
  const handleNoise = useCallback((pos: Vector3, type: 'RUN' | 'THROW') => {
      setLastSound({
          position: { x: pos.x, z: pos.z },
          type,
          timestamp: Date.now() / 1000
      });
  }, []);

  const handleThrow = useCallback((pos: Vector3, vel: Vector3) => {
      const id = Math.random().toString(36).substr(2, 9);
      setThrowables(prev => [...prev, {
          id,
          position: [pos.x, pos.y, pos.z],
          velocity: [vel.x, vel.y, vel.z],
          active: true
      }]);
  }, []);

  const handleThrowableLand = useCallback((id: string, pos: Vector3) => {
      handleNoise(pos, 'THROW');
      setThrowables(prev => prev.map(item => 
          item.id === id ? { ...item, active: false } : item
      ));
  }, [handleNoise]);

  return (
    <>
      <fog attach="fog" args={['#000000', 0, 12]} />
      <ambientLight intensity={0.05} />
      
      <MazeMap 
        maze={maze} 
        setBeds={setBeds}
        setTables={setTables}
      />

      <Furnishings 
        beds={beds}
        tables={tables}
        throwables={throwables}
        onThrowableLand={handleThrowableLand}
      />
      
      <Player 
        maze={maze} 
        beds={beds}
        tables={tables}
        setPlayerPosition={setPlayerPos} 
        onExitReached={onVictory} 
        gameActive={gameActive}
        setIsHidden={setIsHidden}
        onThrow={handleThrow}
        onMakeNoise={(pos) => handleNoise(pos, 'RUN')}
        isMobile={isMobile}
      />
      
      <Granny 
        maze={maze} 
        playerPos={playerPos} 
        onCatch={onGameOver} 
        gameActive={gameActive}
        setTaunt={setTaunt}
        playerHidden={isHidden}
        lastSound={lastSound}
      />
    </>
  );
};

export default Scene;
