
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { MazeGrid, SoundEvent } from '../../types';
import { 
    CELL_SIZE, 
    GRANNY_SPEED_CHASE, 
    GRANNY_SPEED_WANDER, 
    GRANNY_SPEED_INVESTIGATE,
    GRANNY_DETECT_RANGE, 
    GRANNY_KILL_RANGE 
} from '../../constants';
import { generateGrannyTaunt } from '../../services/gemini';
import { findPath } from '../../utils/pathfinding';

interface GrannyProps {
  playerPos: Vector3;
  maze: MazeGrid;
  onCatch: () => void;
  gameActive: boolean;
  setTaunt: (text: string) => void;
  playerHidden: boolean;
  lastSound: SoundEvent | null;
}

const Granny: React.FC<GrannyProps> = ({ 
    playerPos, 
    maze, 
    onCatch, 
    gameActive, 
    setTaunt,
    playerHidden,
    lastSound
}) => {
  const grannyRef = useRef<Group>(null);
  const [lastTauntTime, setLastTauntTime] = useState(0);

  // Init position
  const initialPos = useRef(new Vector3(maze.exit.x * CELL_SIZE, 0, maze.exit.z * CELL_SIZE));
  
  // AI State
  const state = useRef<'WANDER' | 'CHASE' | 'INVESTIGATE'>('WANDER');
  const path = useRef<{x: number, z: number}[]>([]);
  const targetPos = useRef<Vector3 | null>(null);
  const lastPathCalcTime = useRef(0);
  const processedSoundTime = useRef(0);
  const investigateTimer = useRef(0);
  
  useFrame((clock, delta) => {
    if (!gameActive || !grannyRef.current) return;

    const grannyPos = grannyRef.current.position;
    const now = clock.clock.elapsedTime;
    
    // Kill Check
    const dx = grannyPos.x - playerPos.x;
    const dz = grannyPos.z - playerPos.z;
    const distanceToPlayerFlat = Math.sqrt(dx * dx + dz * dz);
    const distanceToPlayer3D = grannyPos.distanceTo(playerPos);

    if (distanceToPlayerFlat < GRANNY_KILL_RANGE && !playerHidden) {
        onCatch();
        return;
    }

    // --- State Transitions ---

    // 1. Hear Sound
    if (lastSound && lastSound.timestamp > processedSoundTime.current) {
        const soundDist = grannyPos.distanceTo(new Vector3(lastSound.position.x, 0, lastSound.position.z));
        if (soundDist < 40) {
             state.current = 'INVESTIGATE';
             processedSoundTime.current = lastSound.timestamp;
             path.current = [];
             investigateTimer.current = 5.0; 
             targetPos.current = new Vector3(lastSound.position.x, 0, lastSound.position.z);
        }
    }

    // 2. See Player
    if (!playerHidden && distanceToPlayer3D < GRANNY_DETECT_RANGE) {
        state.current = 'CHASE';
    } else if (state.current === 'CHASE' && (playerHidden || distanceToPlayer3D > GRANNY_DETECT_RANGE * 1.5)) {
        state.current = 'WANDER';
    }

    // 3. Investigate Timeout
    if (state.current === 'INVESTIGATE') {
        investigateTimer.current -= delta;
        if (investigateTimer.current <= 0) {
            state.current = 'WANDER';
        }
    }

    // --- Pathfinding & Movement ---
    if (now - lastPathCalcTime.current > 0.5 || path.current.length === 0) {
        const gx = Math.round(grannyPos.x / CELL_SIZE);
        const gz = Math.round(grannyPos.z / CELL_SIZE);
        
        let destX = gx;
        let destZ = gz;

        if (state.current === 'CHASE') {
             destX = Math.round(playerPos.x / CELL_SIZE);
             destZ = Math.round(playerPos.z / CELL_SIZE);
        } else if (state.current === 'INVESTIGATE' && targetPos.current) {
             destX = Math.round(targetPos.current.x / CELL_SIZE);
             destZ = Math.round(targetPos.current.z / CELL_SIZE);
        } else if (state.current === 'WANDER' && path.current.length === 0) {
             let found = false;
             let attempts = 0;
             while(!found && attempts < 10) {
                const rx = Math.floor(Math.random() * maze.width);
                const rz = Math.floor(Math.random() * maze.height);
                if (maze.cells[rz][rx] === 0) {
                    destX = rx;
                    destZ = rz;
                    found = true;
                }
                attempts++;
             }
        }

        const newPath = findPath(maze, {x: gx, z: gz}, {x: destX, z: destZ});
        if (newPath.length > 0) {
            if (newPath[0].x === gx && newPath[0].z === gz) newPath.shift();
            path.current = newPath;
        }
        lastPathCalcTime.current = now;
    }

    // Move
    let speed = GRANNY_SPEED_WANDER;
    if (state.current === 'CHASE') speed = GRANNY_SPEED_CHASE;
    if (state.current === 'INVESTIGATE') speed = GRANNY_SPEED_INVESTIGATE;

    if (path.current.length > 0) {
        const nextNode = path.current[0];
        const nextTarget = new Vector3(nextNode.x * CELL_SIZE, 0, nextNode.z * CELL_SIZE);
        
        const dir = nextTarget.clone().sub(grannyPos);
        dir.y = 0;
        const dist = dir.length();

        if (dist < 0.2) {
            path.current.shift();
        } else {
            dir.normalize();
            grannyRef.current.position.add(dir.multiplyScalar(speed * delta));
            
            const targetRotation = Math.atan2(dir.x, dir.z);
            let rotDiff = targetRotation - grannyRef.current.rotation.y;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            grannyRef.current.rotation.y += rotDiff * 10 * delta;
        }
    }

    // Taunt
    if (state.current === 'CHASE' && now - lastTauntTime > 12) {
        setLastTauntTime(now);
        generateGrannyTaunt().then(text => setTaunt(text));
    }
  });

  return (
    <group ref={grannyRef} position={initialPos.current}>
      {/* Visuals */}
      <mesh position={[0, 1.6, 0]}>
        <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
        <meshStandardMaterial color={state.current === 'INVESTIGATE' ? "#442" : "#222"} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.35]} />
        <meshStandardMaterial color="#a89f91" />
      </mesh>
       <mesh position={[0, 2.7, -0.1]}>
        <sphereGeometry args={[0.15]} />
        <meshStandardMaterial color="#ddd" />
      </mesh>
      <mesh position={[0, 1, 0]}>
         <cylinderGeometry args={[0.45, 0.7, 1.5, 16]} />
         <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, 1.1, 0.26]} rotation={[-0.1,0,0]}>
         <planeGeometry args={[0.6, 1.2]} />
         <meshStandardMaterial color="#554433" side={2}/>
      </mesh>
      <mesh position={[0.12, 2.45, 0.25]}>
        <sphereGeometry args={[0.06]} />
        <meshBasicMaterial color={state.current === 'CHASE' ? "red" : "yellow"} toneMapped={false} />
      </mesh>
      <mesh position={[-0.12, 2.45, 0.25]}>
        <sphereGeometry args={[0.06]} />
        <meshBasicMaterial color={state.current === 'CHASE' ? "red" : "yellow"} toneMapped={false} />
      </mesh>
      <pointLight color="red" distance={6} intensity={2} decay={2} position={[0, 2, 0]} />
    </group>
  );
};

export default Granny;
