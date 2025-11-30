
import React, { useEffect, useState, useRef } from 'react';
import { GameState } from '../types';
import { STAMINA_MAX } from '../constants';

interface UIProps {
  gameState: GameState;
  onStart: () => void;
  onRestart: () => void;
  onDeviceSelect: (isMobile: boolean) => void;
  taunt: string | null;
  gameOverMessage: string;
  isJumpscaring?: boolean;
  isMobile: boolean;
}

const UI: React.FC<UIProps> = ({ 
    gameState, 
    onStart, 
    onRestart, 
    onDeviceSelect, 
    taunt, 
    gameOverMessage, 
    isJumpscaring, 
    isMobile 
}) => {
  const [hudState, setHudState] = useState({ 
      stamina: STAMINA_MAX, 
      canHide: false, 
      isHidden: false, 
      runningTime: 0
  });

  // Joystick visual state
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleHudUpdate = (e: any) => {
          setHudState(e.detail);
      };
      
      const handleJoystickMove = (e: any) => {
          if (knobRef.current) {
              const { dx, dy } = e.detail;
              const dist = Math.min(30, Math.sqrt(dx*dx + dy*dy));
              const angle = Math.atan2(dy, dx);
              const tx = Math.cos(angle) * dist;
              const ty = Math.sin(angle) * dist;
              knobRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
          }
      };

      const handleJoystickEnd = () => {
          if (knobRef.current) {
              knobRef.current.style.transform = `translate(0px, 0px)`;
          }
      };

      const el = document.getElementById('game-hud');
      el?.addEventListener('hud-update', handleHudUpdate);
      window.addEventListener('joystick-move', handleJoystickMove);
      window.addEventListener('joystick-end', handleJoystickEnd);
      
      return () => {
          el?.removeEventListener('hud-update', handleHudUpdate);
          window.removeEventListener('joystick-move', handleJoystickMove);
          window.removeEventListener('joystick-end', handleJoystickEnd);
      }
  }, []);

  const triggerMobileAction = (action: string) => {
      window.dispatchEvent(new CustomEvent('mobile-action', { detail: { action } }));
  };

  if (isJumpscaring) {
      return (
          <div className="absolute inset-0 z-[100] bg-red-600 mix-blend-multiply flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/nhffaf/tx/refs/heads/main/noise.png')] opacity-50 animate-pulse"></div>
             <div className="relative z-10 text-9xl font-black text-black animate-ping">RUN</div>
          </div>
      )
  }

  if (gameState === GameState.DEVICE_SELECT) {
      return (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
              <div className="text-center space-y-8 animate-fade-in">
                  <h1 className="text-4xl font-bold text-red-700 tracking-widest border-b border-red-900 pb-4">CHOOSE DEVICE</h1>
                  <div className="flex gap-8 justify-center">
                      <button 
                        onClick={() => onDeviceSelect(false)}
                        className="w-48 h-48 border-2 border-gray-600 hover:border-white hover:bg-white hover:text-black rounded-lg text-2xl font-bold transition-all flex flex-col items-center justify-center"
                      >
                          <span className="text-5xl mb-4">💻</span>
                          PC
                          <div className="text-sm mt-2 font-normal text-gray-400 group-hover:text-black">Mouse & Keyboard</div>
                      </button>
                      <button 
                        onClick={() => onDeviceSelect(true)}
                        className="w-48 h-48 border-2 border-gray-600 hover:border-white hover:bg-white hover:text-black rounded-lg text-2xl font-bold transition-all flex flex-col items-center justify-center"
                      >
                          <span className="text-5xl mb-4">📱</span>
                          MOBILE
                          <div className="text-sm mt-2 font-normal text-gray-400 group-hover:text-black">Joystick & Touch</div>
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  if (gameState === GameState.MENU) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="max-w-md text-center space-y-8 p-8 border border-red-900 shadow-[0_0_50px_rgba(255,0,0,0.5)] bg-black/80 backdrop-blur">
          <h1 className="text-6xl font-bold text-red-700 tracking-tighter mb-4 font-serif">ESCAPE<br/><span className="text-4xl text-gray-400">THE GRANNY</span></h1>
          <p className="text-gray-400">
            You are trapped in the basement. Find the exit.
          </p>
          {!isMobile && (
            <div className="text-sm text-gray-600 space-y-1">
                <p>WASD to Move | SHIFT to Run</p>
                <p>F - Flashlight | G - Throw Distraction</p>
                <p>E - Interact (Hide)</p>
            </div>
          )}
          {isMobile && (
            <div className="text-sm text-gray-600 space-y-1">
                <p>Left Side: Move Joystick</p>
                <p>Right Side: Look Around</p>
                <p>Buttons: Run, Hide, Throw</p>
            </div>
          )}
          <button 
            onClick={onStart}
            className="px-8 py-3 bg-red-900 hover:bg-red-700 text-white font-bold rounded transition-all transform hover:scale-105"
          >
            ENTER BASEMENT
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
     return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/40 backdrop-blur-sm">
        <div className="text-center space-y-6 animate-pulse">
          <h1 className="text-8xl font-black text-red-600 tracking-widest uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,1)]">
            CAUGHT
          </h1>
          <p className="text-2xl text-white font-serif italic max-w-lg mx-auto">
            {gameOverMessage}
          </p>
          <button 
            onClick={onRestart}
            className="mt-8 px-8 py-3 bg-transparent border-2 border-white hover:bg-white hover:text-black text-white font-bold rounded transition-colors"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.VICTORY) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-green-900/20 backdrop-blur-sm">
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-black text-green-500 tracking-widest uppercase">
            ESCAPED
          </h1>
          <p className="text-xl text-white">You survived... for now.</p>
          <button 
            onClick={onRestart}
            className="mt-8 px-8 py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded"
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    );
  }

  // PLAYING STATE HUD
  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
        <div className="text-white opacity-50 text-sm">Find the Green Exit Light...</div>
        
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full">
            {taunt && (
                <h2 className="text-4xl text-red-600 font-bold tracking-widest animate-pulse drop-shadow-md font-serif italic mb-4">
                "{taunt}"
                </h2>
            )}

            {hudState.canHide && !hudState.isHidden && !isMobile && (
                <div className="text-2xl text-white font-bold animate-bounce mt-10">
                    PRESS 'E' TO HIDE
                </div>
            )}
            
            {hudState.isHidden && (
                <div className="text-2xl text-blue-300 font-bold mt-10 border p-2 bg-black/50 inline-block">
                    HIDDEN (EXIT TO MOVE)
                </div>
            )}
        </div>

        {!hudState.isHidden && <div className="crosshair"></div>}

        <div className="w-64 pointer-events-none">
            <div className="flex justify-between text-white text-xs mb-1 font-bold">
                <span>STAMINA</span>
                {hudState.runningTime > 3 && <span className="text-red-500 animate-pulse">MAKING NOISE!</span>}
            </div>
            <div className="w-full h-4 bg-gray-800 border border-gray-600 rounded overflow-hidden">
                <div 
                    className={`h-full transition-all duration-200 ${hudState.stamina < 20 ? 'bg-red-600' : 'bg-white'}`}
                    style={{ width: `${(hudState.stamina / STAMINA_MAX) * 100}%` }}
                ></div>
            </div>
            {!isMobile && (
             <div className="text-xs text-gray-500 mt-2">
                 'G' to Throw Distraction
             </div>
            )}
        </div>

        {/* Mobile Controls Overlay */}
        {isMobile && (
            <div className="absolute inset-0 pointer-events-auto flex justify-between items-end pb-8 px-8 z-40 select-none touch-none">
                {/* Visual Joystick Anchor */}
                <div ref={joystickRef} className="relative w-32 h-32 border-2 border-white/20 rounded-full flex items-center justify-center bg-black/20 ml-4 mb-4">
                    <div ref={knobRef} className="w-12 h-12 bg-white/50 rounded-full shadow-lg"></div>
                    <div className="absolute -bottom-6 text-white/40 text-xs">MOVE AREA</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-6 mb-4 mr-4">
                     <button 
                        onTouchStart={(e) => { e.preventDefault(); triggerMobileAction('THROW') }}
                        className="w-16 h-16 rounded-full bg-yellow-900/50 border border-yellow-500 text-white font-bold active:bg-yellow-700 active:scale-95 transition-transform text-xs"
                     >
                        THROW
                     </button>
                     <button 
                        onTouchStart={(e) => { e.preventDefault(); triggerMobileAction('INTERACT') }}
                        className={`w-16 h-16 rounded-full border text-white font-bold active:bg-blue-700 active:scale-95 transition-transform text-xs ${hudState.canHide ? 'bg-blue-600/80 border-blue-400 animate-pulse' : 'bg-gray-800/50 border-gray-600'}`}
                     >
                        HIDE
                     </button>
                     <button 
                        onTouchStart={(e) => { e.preventDefault(); triggerMobileAction('RUN_START') }}
                        onTouchEnd={(e) => { e.preventDefault(); triggerMobileAction('RUN_END') }}
                        className="w-20 h-20 rounded-full bg-red-900/50 border border-red-500 text-white font-bold active:bg-red-700 active:scale-95 transition-transform"
                     >
                        RUN
                     </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default UI;
