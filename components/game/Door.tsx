
import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Group, TextureLoader, RepeatWrapping, MathUtils } from 'three';
import { Door as DoorType } from '../../types';
import { CELL_SIZE, WALL_HEIGHT } from '../../constants';

interface DoorProps {
  door: DoorType;
}

const Door: React.FC<DoorProps> = ({ door }) => {
  const groupRef = useRef<Group>(null);
  const hingeRef = useRef<Group>(null);
  const doorTexture = useLoader(TextureLoader, "https://raw.githubusercontent.com/nhffaf/tx/refs/heads/main/table.png");

  doorTexture.wrapS = doorTexture.wrapT = RepeatWrapping;
  
  const width = CELL_SIZE;
  const height = WALL_HEIGHT * 0.8;
  const thickness = 0.2;

  useFrame((state, delta) => {
      if (hingeRef.current) {
          const targetRot = door.isOpen ? Math.PI / 2 + 0.2 : 0;
          hingeRef.current.rotation.y = MathUtils.lerp(hingeRef.current.rotation.y, targetRot, delta * 5);
      }
  });

  return (
    <group 
        ref={groupRef} 
        position={[door.x * CELL_SIZE, 0, door.z * CELL_SIZE]} 
        rotation={[0, door.rotation, 0]}
    >
        {/* Frame */}
        <mesh position={[0, height/2, -width/2 + 0.1]}>
             <boxGeometry args={[0.2, height, 0.2]} />
             <meshStandardMaterial color="#2d1810" />
        </mesh>
        <mesh position={[0, height/2, width/2 - 0.1]}>
             <boxGeometry args={[0.2, height, 0.2]} />
             <meshStandardMaterial color="#2d1810" />
        </mesh>
        <mesh position={[0, height - 0.1, 0]}>
             <boxGeometry args={[0.2, 0.2, width]} />
             <meshStandardMaterial color="#2d1810" />
        </mesh>

        {/* Moving Door Part - Pivots from edge */}
        <group ref={hingeRef} position={[0, 0, width/2 - 0.1]}>
             <mesh position={[0, height/2, -width/2 + 0.1]}>
                <boxGeometry args={[thickness, height - 0.2, width - 0.2]} />
                <meshStandardMaterial map={doorTexture} color="#554433" />
             </mesh>
             {/* Handle */}
             <mesh position={[thickness, height/2, -width + 0.5]}>
                 <sphereGeometry args={[0.1]} />
                 <meshStandardMaterial color="gold" />
             </mesh>
        </group>
    </group>
  );
};

export default Door;
