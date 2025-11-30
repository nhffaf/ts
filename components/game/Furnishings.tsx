
import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Vector3, Mesh, TextureLoader, RepeatWrapping } from 'three';
import { ThrowableItem } from '../../types';

interface FurnishingsProps {
  beds: Vector3[];
  tables: Vector3[];
  throwables: ThrowableItem[];
  onThrowableLand: (id: string, pos: Vector3) => void;
}

export const Furnishings: React.FC<FurnishingsProps> = ({ beds, tables, throwables, onThrowableLand }) => {
  const bedTexture = useLoader(TextureLoader, "https://raw.githubusercontent.com/nhffaf/tx/refs/heads/main/fabric.png");
  const tableTexture = useLoader(TextureLoader, "https://raw.githubusercontent.com/nhffaf/tx/refs/heads/main/table.png");

  // Configure textures
  bedTexture.wrapS = bedTexture.wrapT = RepeatWrapping;
  bedTexture.repeat.set(2, 2);
  
  tableTexture.wrapS = tableTexture.wrapT = RepeatWrapping;
  tableTexture.repeat.set(2, 2);

  return (
    <group>
      {/* Beds */}
      {beds.map((pos, i) => (
        <group key={`bed-${i}`} position={pos}>
            {/* Frame - Bigger */}
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[2.2, 0.4, 3.2]} />
                <meshStandardMaterial color="#2d1810" />
            </mesh>
            {/* Mattress - Bigger & Textured */}
            <mesh position={[0, 0.65, 0]}>
                <boxGeometry args={[2.0, 0.4, 3.0]} />
                <meshStandardMaterial map={bedTexture} color="#bbb" />
            </mesh>
            {/* Pillow */}
            <mesh position={[0, 0.9, -1.0]}>
                <boxGeometry args={[1.5, 0.25, 0.7]} />
                <meshStandardMaterial color="#ddd" />
            </mesh>
            {/* Legs */}
            <mesh position={[-0.9, 0.15, -1.4]}>
                 <boxGeometry args={[0.15, 0.3, 0.15]} />
                 <meshStandardMaterial color="#2d1810" />
            </mesh>
            <mesh position={[0.9, 0.15, -1.4]}>
                 <boxGeometry args={[0.15, 0.3, 0.15]} />
                 <meshStandardMaterial color="#2d1810" />
            </mesh>
             <mesh position={[-0.9, 0.15, 1.4]}>
                 <boxGeometry args={[0.15, 0.3, 0.15]} />
                 <meshStandardMaterial color="#2d1810" />
            </mesh>
            <mesh position={[0.9, 0.15, 1.4]}>
                 <boxGeometry args={[0.15, 0.3, 0.15]} />
                 <meshStandardMaterial color="#2d1810" />
            </mesh>
        </group>
      ))}

      {/* Tables - Bigger */}
      {tables.map((pos, i) => (
        <group key={`table-${i}`} position={pos}>
            {/* Top - Textured */}
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[2.2, 0.15, 2.2]} />
                <meshStandardMaterial map={tableTexture} color="#888" />
            </mesh>
            {/* Legs */}
            <mesh position={[-0.9, 0.45, -0.9]}>
                 <boxGeometry args={[0.15, 0.9, 0.15]} />
                 <meshStandardMaterial color="#3a2218" />
            </mesh>
            <mesh position={[0.9, 0.45, -0.9]}>
                 <boxGeometry args={[0.15, 0.9, 0.15]} />
                 <meshStandardMaterial color="#3a2218" />
            </mesh>
            <mesh position={[-0.9, 0.45, 0.9]}>
                 <boxGeometry args={[0.15, 0.9, 0.15]} />
                 <meshStandardMaterial color="#3a2218" />
            </mesh>
            <mesh position={[0.9, 0.45, 0.9]}>
                 <boxGeometry args={[0.15, 0.9, 0.15]} />
                 <meshStandardMaterial color="#3a2218" />
            </mesh>
        </group>
      ))}

      {/* Throwables (Bottles/Trash) */}
      {throwables.map((item) => (
          <Throwable key={item.id} item={item} onLand={onThrowableLand} />
      ))}
    </group>
  );
};

const Throwable: React.FC<{ item: ThrowableItem; onLand: (id: string, pos: Vector3) => void }> = ({ item, onLand }) => {
    const meshRef = useRef<Mesh>(null);
    const posRef = useRef(new Vector3(...item.position));
    const velRef = useRef(new Vector3(...item.velocity));
    const landed = useRef(false);

    useFrame((_, delta) => {
        if (!meshRef.current || landed.current || !item.active) return;

        // Simple Physics
        velRef.current.y -= 25 * delta; // Gravity
        
        posRef.current.add(velRef.current.clone().multiplyScalar(delta));

        // Floor collision
        if (posRef.current.y <= 0.2) {
            posRef.current.y = 0.2;
            landed.current = true;
            onLand(item.id, posRef.current.clone());
        }

        meshRef.current.position.copy(posRef.current);
        meshRef.current.rotation.x += delta * 5;
        meshRef.current.rotation.z += delta * 5;
    });

    if (!item.active) return null;

    return (
        <mesh ref={meshRef} position={item.position}>
            <cylinderGeometry args={[0.05, 0.05, 0.3]} />
            <meshStandardMaterial color="green" transparent opacity={0.8} />
        </mesh>
    );
}
