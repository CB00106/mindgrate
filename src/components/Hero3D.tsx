import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const Hero3D: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null!);

    useFrame((state) => {
        const { clock, pointer } = state;
        if (meshRef.current) {
            // Smooth rotation
            meshRef.current.rotation.x = THREE.MathUtils.lerp(
                meshRef.current.rotation.x,
                pointer.y * 0.2,
                0.1
            );
            meshRef.current.rotation.y = THREE.MathUtils.lerp(
                meshRef.current.rotation.y,
                pointer.x * 0.2 + clock.getElapsedTime() * 0.1,
                0.1
            );
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <mesh ref={meshRef} scale={1.5}>
                <icosahedronGeometry args={[1, 2]} />
                <MeshDistortMaterial
                    color="#2D7DFF"
                    attach="material"
                    distort={0.4}
                    speed={2}
                    roughness={0.2}
                    metalness={0.8}
                    wireframe={true}
                />
            </mesh>
            <mesh scale={1.4}>
                <icosahedronGeometry args={[1, 2]} />
                <meshStandardMaterial
                    color="#1a1a1a"
                    transparent
                    opacity={0.2}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </Float>
    );
};

export default Hero3D;
