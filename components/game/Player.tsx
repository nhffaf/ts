
import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls, Html } from '@react-three/drei';
import { Vector3, Object3D, MathUtils, Euler } from 'three';
import { MazeGrid } from '../../types';
import { 
    CELL_SIZE, 
    PLAYER_SPEED, 
    PLAYER_RUN_SPEED, 
    STAMINA_MAX, 
    STAMINA_DRAIN_RATE, 
    STAMINA_REGEN_RATE,
    RUN_NOISE_THRESHOLD,
    HIDE_DISTANCE,
    THROW_FORCE
} from '../../constants';

interface PlayerProps {
  maze: MazeGrid;
  beds: Vector3[];
  tables?: Vector3[];
  setPlayerPosition: (pos: Vector3) => void;
  onExitReached: () => void;
  gameActive: boolean;
  setIsHidden: (hidden: boolean) => void;
  onThrow: (pos: Vector3, velocity: Vector3) => void;
  onMakeNoise: (pos: Vector3) => void;
  isMobile: boolean;
}

const PLAYER_HEIGHT = 2.1;
const HIDDEN_HEIGHT = 0.5;

const Player: React.FC<PlayerProps> = ({ 
    maze, 
    beds,
    tables = [],
    setPlayerPosition, 
    onExitReached, 
    gameActive,
    setIsHidden,
    onThrow,
    onMakeNoise,
    isMobile
}) => {
  const { camera } = useThree();
  
  // Movement Refs
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const isRunningInput = useRef(false);
  
  const runningTime = useRef(0);
  
  const [flashlightOn, setFlashlightOn] = useState(true);
  const [lightTarget] = useState(() => new Object3D());
  const [isLocked, setIsLocked] = useState(false);

  // Game mechanics state
  const [stamina, setStamina] = useState(STAMINA_MAX);
  const [isHidden, setHiddenState] = useState(false);
  const [canHide, setCanHide] = useState(false);

  // Initial spawn and light setup
  useEffect(() => {
    const startX = maze.start.x * CELL_SIZE;
    const startZ = maze.start.z * CELL_SIZE;
    camera.position.set(startX, PLAYER_HEIGHT, startZ);
    camera.rotation.set(0, Math.PI, 0);
  }, [maze, camera]);

  // Mobile Touch Refs
  const joystickStartPos = useRef<{x: number, y: number} | null>(null);
  const joystickId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const lookStartPos = useRef<{x: number, y: number} | null>(null);
  
  // Handle Hiding Toggle
  const toggleHide = () => {
    if (isHidden) {
        // Unhide
        setHiddenState(false);
        setIsHidden(false);
        camera.position.y = PLAYER_HEIGHT;
    } else if (canHide) {
        // Hide
        setHiddenState(true);
        setIsHidden(true);
    }
  };

  // Handle Throwing
  const throwItem = () => {
      if (isHidden) return;
      const dir = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const vel = dir.multiplyScalar(THROW_FORCE);
      vel.y = 2; // slight arc up
      onThrow(camera.position.clone(), vel);
  };

  // Mobile Action Handlers
  useEffect(() => {
      const handleMobileAction = (e: CustomEvent) => {
          if (e.detail.action === 'RUN_START') isRunningInput.current = true;
          if (e.detail.action === 'RUN_END') isRunningInput.current = false;
          if (e.detail.action === 'INTERACT') toggleHide();
          if (e.detail.action === 'THROW') throwItem();
      };
      window.addEventListener('mobile-action', handleMobileAction as EventListener);
      return () => window.removeEventListener('mobile-action', handleMobileAction as EventListener);
  }, [canHide, isHidden]);


  // Input listeners (PC)
  useEffect(() => {
    if (isMobile) return;

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward.current = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft.current = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward.current = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight.current = true; break;
        case 'ShiftLeft': isRunningInput.current = true; break;
        case 'KeyF': setFlashlightOn(prev => !prev); break;
        case 'KeyE': toggleHide(); break;
        case 'KeyG': throwItem(); break;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward.current = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft.current = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward.current = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight.current = false; break;
        case 'ShiftLeft': isRunningInput.current = false; break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [canHide, isHidden, isMobile]);

  // Mobile Touch Logic - Improved Joystick
  useEffect(() => {
      if (!isMobile || !gameActive) return;

      const handleTouchStart = (e: TouchEvent) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
              const t = e.changedTouches[i];
              // Left side (Joystick) - 0 to 40% width
              if (t.clientX < window.innerWidth * 0.4) {
                  if (joystickId.current === null) {
                      joystickId.current = t.identifier;
                      joystickStartPos.current = { x: t.clientX, y: t.clientY };
                      
                      // Notify UI to show joystick active state
                      window.dispatchEvent(new CustomEvent('joystick-active', { detail: { x: t.clientX, y: t.clientY } }));
                  }
              } 
              // Right side (Look) - 50% to 100% width
              else if (t.clientX > window.innerWidth * 0.5) {
                  if (lookId.current === null) {
                      lookId.current = t.identifier;
                      lookStartPos.current = { x: t.clientX, y: t.clientY };
                  }
              }
          }
      };

      const handleTouchMove = (e: TouchEvent) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
              const t = e.changedTouches[i];
              
              // Joystick Logic
              if (t.identifier === joystickId.current && joystickStartPos.current) {
                  const dx = t.clientX - joystickStartPos.current.x;
                  const dy = t.clientY - joystickStartPos.current.y;
                  
                  // Reset flags
                  moveForward.current = false;
                  moveBackward.current = false;
                  moveLeft.current = false;
                  moveRight.current = false;

                  const distance = Math.sqrt(dx*dx + dy*dy);
                  const threshold = 10; // Min drag distance

                  if (distance > threshold) {
                      // Normalize angle
                      const angle = Math.atan2(dy, dx); 
                      // angle is in radians: 0 is Right, PI/2 is Down, -PI/2 is Up, PI is Left

                      // Convert angle to directional booleans with overlap for diagonals
                      // Forward (Up): -PI*3/4 to -PI/4
                      if (angle > -Math.PI * 0.8 && angle < -Math.PI * 0.2) moveForward.current = true;
                      
                      // Backward (Down): PI/4 to PI*3/4
                      if (angle > Math.PI * 0.2 && angle < Math.PI * 0.8) moveBackward.current = true;
                      
                      // Left: -PI to -PI*3/4 OR PI*3/4 to PI
                      if (angle < -Math.PI * 0.6 || angle > Math.PI * 0.6) moveLeft.current = true;

                      // Right: -PI/4 to PI/4
                      if (angle > -Math.PI * 0.4 && angle < Math.PI * 0.4) moveRight.current = true;
                  }
                  
                  window.dispatchEvent(new CustomEvent('joystick-move', { detail: { dx, dy } }));
              }

              // Look Logic
              if (t.identifier === lookId.current && lookStartPos.current) {
                  const sensitivity = 0.004;
                  const dx = t.clientX - lookStartPos.current.x;
                  const dy = t.clientY - lookStartPos.current.y;

                  const euler = new Euler(0, 0, 0, 'YXZ');
                  euler.setFromQuaternion(camera.quaternion);
                  euler.y -= dx * sensitivity;
                  euler.x -= dy * sensitivity;
                  euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
                  camera.quaternion.setFromEuler(euler);

                  lookStartPos.current = { x: t.clientX, y: t.clientY };
              }
          }
      };

      const handleTouchEnd = (e: TouchEvent) => {
          for (let i = 0; i < e.changedTouches.length; i++) {
              const t = e.changedTouches[i];
              if (t.identifier === joystickId.current) {
                  joystickId.current = null;
                  joystickStartPos.current = null;
                  moveForward.current = false;
                  moveBackward.current = false;
                  moveLeft.current = false;
                  moveRight.current = false;
                  window.dispatchEvent(new CustomEvent('joystick-end'));
              }
              if (t.identifier === lookId.current) {
                  lookId.current = null;
                  lookStartPos.current = null;
              }
          }
      };

      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
          document.removeEventListener('touchstart', handleTouchStart);
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
      };
  }, [isMobile, gameActive, camera]);


  // Check Hiding Spot
  useFrame(() => {
      if (!gameActive) return;
      let nearbyBed = false;
      for (const bedPos of beds) {
          if (camera.position.distanceTo(bedPos) < HIDE_DISTANCE) {
              nearbyBed = true;
              break;
          }
      }
      setCanHide(nearbyBed);
  });

  const checkCollision = (nextPos: Vector3): boolean => {
    const buffer = 0.3; 
    
    // 1. Wall Collision
    const checkPoint = (x: number, z: number) => {
        const gridX = Math.round(x / CELL_SIZE);
        const gridZ = Math.round(z / CELL_SIZE);
        if (gridX < 0 || gridX >= maze.width || gridZ < 0 || gridZ >= maze.height) return true; 
        return maze.cells[gridZ][gridX] === 1;
    }

    if (checkPoint(nextPos.x + buffer, nextPos.z + buffer)) return true;
    if (checkPoint(nextPos.x - buffer, nextPos.z + buffer)) return true;
    if (checkPoint(nextPos.x + buffer, nextPos.z - buffer)) return true;
    if (checkPoint(nextPos.x - buffer, nextPos.z - buffer)) return true;

    // 2. Furniture Collision (AABB)
    for (const bed of beds) {
        if (
            nextPos.x > bed.x - 1.3 && nextPos.x < bed.x + 1.3 &&
            nextPos.z > bed.z - 1.8 && nextPos.z < bed.z + 1.8
        ) return true;
    }
    for (const table of tables) {
        if (
            nextPos.x > table.x - 1.3 && nextPos.x < table.x + 1.3 &&
            nextPos.z > table.z - 1.3 && nextPos.z < table.z + 1.3
        ) return true;
    }

    return false;
  };

  useFrame(({ clock }, delta) => {
    if (!gameActive) return;
    if (!isMobile && !isLocked) return; 

    // Movement Logic
    if (isHidden) {
        camera.position.y = MathUtils.lerp(camera.position.y, HIDDEN_HEIGHT, 0.1);
        setStamina(prev => Math.min(prev + STAMINA_REGEN_RATE * delta, STAMINA_MAX));
        return;
    }

    // Stamina & Speed Calc
    let speed = PLAYER_SPEED;
    const isMovingInput = (moveForward.current || moveBackward.current || moveLeft.current || moveRight.current);
    const isActuallyRunning = isRunningInput.current && stamina > 0 && isMovingInput;

    if (isActuallyRunning) {
        speed = PLAYER_RUN_SPEED;
        setStamina(prev => Math.max(prev - STAMINA_DRAIN_RATE * delta, 0));
        runningTime.current += delta;
        
        if (runningTime.current > RUN_NOISE_THRESHOLD) {
            onMakeNoise(camera.position.clone());
            runningTime.current = 0;
        }
    } else {
        setStamina(prev => Math.min(prev + STAMINA_REGEN_RATE * delta, STAMINA_MAX));
        runningTime.current = Math.max(0, runningTime.current - delta);
    }
    
    // Movement
    const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    const intendedMove = new Vector3();
    if (moveForward.current) intendedMove.add(forward);
    if (moveBackward.current) intendedMove.sub(forward);
    if (moveRight.current) intendedMove.add(right);
    if (moveLeft.current) intendedMove.sub(right);

    const isMoving = intendedMove.lengthSq() > 0;

    if (isMoving) {
      intendedMove.normalize().multiplyScalar(speed * delta);

      const nextPosX = camera.position.clone().add(new Vector3(intendedMove.x, 0, 0));
      if (!checkCollision(nextPosX)) {
          camera.position.x = nextPosX.x;
      }

      const nextPosZ = camera.position.clone().add(new Vector3(0, 0, intendedMove.z));
      if (!checkCollision(nextPosZ)) {
          camera.position.z = nextPosZ.z;
      }
    }

    // Head Bobbing
    if (isMoving) {
        const bobFreq = isActuallyRunning ? 18 : 10;
        const bobAmp = isActuallyRunning ? 0.15 : 0.08; 
        const yOffset = Math.sin(clock.elapsedTime * bobFreq) * bobAmp;
        camera.position.y = MathUtils.lerp(camera.position.y, PLAYER_HEIGHT + yOffset, 0.2);
    } else {
        camera.position.y = MathUtils.lerp(camera.position.y, PLAYER_HEIGHT, 0.1);
    }

    setPlayerPosition(camera.position.clone());

    // Exit Check
    const distToExit = camera.position.distanceTo(new Vector3(maze.exit.x * CELL_SIZE, PLAYER_HEIGHT, maze.exit.z * CELL_SIZE));
    if (distToExit < 2) {
        onExitReached();
    }
  });

  return (
    <>
      {!isMobile && (
          <PointerLockControls 
              selector="#root"
              onLock={() => setIsLocked(true)}
              onUnlock={() => setIsLocked(false)}
          />
      )}
      
      {!isLocked && gameActive && !isMobile && (
          <Html center>
              <div className="text-white text-2xl font-mono bg-black/80 p-4 border border-red-800 rounded">
                  CLICK TO RESUME
              </div>
          </Html>
      )}

      <primitive object={camera}>
        <primitive object={lightTarget} position={[0, 0, -5]} />
        <spotLight 
            position={[0.3, -0.2, 0.5]} 
            target={lightTarget}
            angle={0.6} 
            penumbra={0.3} 
            intensity={flashlightOn ? 80 : 0} 
            distance={70}
            color="#fffadc"
            castShadow
        />
        <pointLight intensity={flashlightOn ? 1.0 : 0} distance={5} color="#fffadc" position={[0, 0, 0]} />
      </primitive>

      <group>
          <HtmlOverlay 
            stamina={stamina} 
            canHide={canHide} 
            isHidden={isHidden} 
            runningTime={runningTime.current}
            isMobile={isMobile}
          />
      </group>
    </>
  );
};

const HtmlOverlay = ({ stamina, canHide, isHidden, runningTime, isMobile }: any) => {
    useEffect(() => {
        const hud = document.getElementById('game-hud');
        if (hud) {
            hud.dispatchEvent(new CustomEvent('hud-update', { 
                detail: { stamina, canHide, isHidden, runningTime, isMobile } 
            }));
        }
    }, [stamina, canHide, isHidden, runningTime, isMobile]);
    return null;
};

export default Player;
