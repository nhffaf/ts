
import React, { useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameState, MazeGrid } from './types';
import { MAZE_SIZE } from './constants';
import { generateMaze } from './utils/mazeGenerator';
import { generateGameOverMessage } from './services/gemini';
import { playScream } from './utils/audio';
import Scene from './components/game/Scene';
import MainMenuScene from './components/menu/MainMenuScene';
import UI from './components/UI';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.DEVICE_SELECT);
  const [maze, setMaze] = useState<MazeGrid>(() => generateMaze(MAZE_SIZE, MAZE_SIZE));
  const [taunt, setTaunt] = useState<string | null>(null);
  const [gameOverMsg, setGameOverMsg] = useState<string>("She found you.");
  const [isJumpscaring, setIsJumpscaring] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleDeviceSelect = (mobile: boolean) => {
      setIsMobile(mobile);
      setGameState(GameState.MENU);
  };

  const startGame = () => {
    setMaze(generateMaze(MAZE_SIZE, MAZE_SIZE));
    setGameState(GameState.PLAYING);
    setTaunt(null);
    setIsJumpscaring(false);
  };

  const handleGameOver = useCallback(async () => {
    if (gameState !== GameState.PLAYING || isJumpscaring) return;
    
    setIsJumpscaring(true);
    playScream();

    const msgPromise = generateGameOverMessage();

    setTimeout(async () => {
        setGameState(GameState.GAME_OVER);
        setIsJumpscaring(false);
        const msg = await msgPromise;
        setGameOverMsg(msg);
    }, 1500);
    
  }, [gameState, isJumpscaring]);

  const handleVictory = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    setGameState(GameState.VICTORY);
  }, [gameState]);

  const handleSetTaunt = useCallback((text: string) => {
    setTaunt(text);
    setTimeout(() => setTaunt(null), 4000);
  }, []);

  return (
    <div className={`w-full h-full bg-black relative ${isJumpscaring ? 'animate-shake' : ''}`}>
      <Canvas shadows>
        <Suspense fallback={null}>
          {(gameState === GameState.MENU || gameState === GameState.DEVICE_SELECT) ? (
              <MainMenuScene />
          ) : (
             <Scene 
                maze={maze} 
                onGameOver={handleGameOver} 
                onVictory={handleVictory} 
                gameActive={gameState === GameState.PLAYING && !isJumpscaring}
                setTaunt={handleSetTaunt}
                isMobile={isMobile}
              />
          )}
        </Suspense>
      </Canvas>

      <UI 
        gameState={gameState} 
        onStart={startGame} 
        onRestart={startGame} 
        onDeviceSelect={handleDeviceSelect}
        taunt={taunt}
        gameOverMessage={gameOverMsg}
        isJumpscaring={isJumpscaring}
        isMobile={isMobile}
      />
      
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
