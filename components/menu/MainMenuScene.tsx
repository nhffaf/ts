
import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, RepeatWrapping } from 'three';
import { WALL_HEIGHT } from '../../constants';

const MainMenuScene: React.FC = () => {
  const tableTexture = useLoader(TextureLoader, "https://raw.githubusercontent.com/nhffaf/tx/refs/heads/main/table.png");
  tableTexture.wrapS = tableTexture.wrapT = RepeatWrapping;
  
  const grannyRef = useRef<any>(null);

  useFrame((state) => {
      // Subtle breathing animation for Granny
      if (grannyRef.current) {
          grannyRef.current.position.y = 0 + Math.sin(state.clock.elapsedTime) * 0.05;
          grannyRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      }
  });

  return (
    <>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 2, 10]} />
      
      {/* Lighting */}
      <ambientLight intensity={0.1} />
      <spotLight position={[2, 4, 3]} angle={0.5} penumbra={1} intensity={50} castShadow color="#aaddff" />
      <pointLight position={[-1, 2, -1]} intensity={5} color="red" distance={5} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
         <planeGeometry args={[20, 20]} />
         <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* Table */}
      <group position={[0, 0, 1]}>
           <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[2, 0.1, 1.2]} />
                <meshStandardMaterial map={tableTexture} color="#554433" />
           </mesh>
           {/* Legs */}
           <mesh position={[-0.9, 0.4, -0.5]}><boxGeometry args={[0.1, 0.8, 0.1]} /><meshStandardMaterial color="#3a2218" /></mesh>
           <mesh position={[0.9, 0.4, -0.5]}><boxGeometry args={[0.1, 0.8, 0.1]} /><meshStandardMaterial color="#3a2218" /></mesh>
           <mesh position={[-0.9, 0.4, 0.5]}><boxGeometry args={[0.1, 0.8, 0.1]} /><meshStandardMaterial color="#3a2218" /></mesh>
           <mesh position={[0.9, 0.4, 0.5]}><boxGeometry args={[0.1, 0.8, 0.1]} /><meshStandardMaterial color="#3a2218" /></mesh>

           {/* Blood Pool */}
           <mesh position={[0.3, 0.86, 0.2]} rotation={[-Math.PI/2, 0, 0]}>
               <circleGeometry args={[0.3]} />
               <meshStandardMaterial color="#880000" transparent opacity={0.8} roughness={0.1} />
           </mesh>

           {/* Flashlight Prop */}
           <group position={[-0.4, 0.9, 0.1]} rotation={[0, 0.5, 0]}>
                <mesh rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.3]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                     <coneGeometry args={[0.06, 0.1]} />
                     <meshStandardMaterial color="silver" />
                </mesh>
                <spotLight position={[0.2, 0, 0]} target-position={[5, 1, 0]} angle={0.4} penumbra={0.2} intensity={20} color="#fffadc" />
           </group>
      </group>

      {/* Granny */}
      <group ref={grannyRef} position={[0, 0, -2]}>
        <mesh position={[0, 1.6, 0]}>
            <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
            <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, 2.4, 0]}>
            <sphereGeometry args={[0.35]} />
            <meshStandardMaterial color="#a89f91" />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.12, 2.45, 0.25]}>
            <sphereGeometry args={[0.06]} />
            <meshBasicMaterial color="red" />
        </mesh>
        <mesh position={[-0.12, 2.45, 0.25]}>
            <sphereGeometry args={[0.06]} />
            <meshBasicMaterial color="red" />
        </mesh>
         <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.45, 0.7, 1.5, 16]} />
            <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>

    </>
  );
};

export default MainMenuScene;
