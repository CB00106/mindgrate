import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticlesBackground: React.FC = () => {
    const count = 60000;
    const mesh = useRef<THREE.Points>(null!);

    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const d = 20;
            const x = (Math.random() - 0.5) * d;
            const y = (Math.random() - 0.5) * d;
            const z = (Math.random() - 0.5) * d;
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }
        return positions;
    }, [count]);

    useFrame((state) => {
        const { clock, pointer } = state;
        if (mesh.current) {
            mesh.current.rotation.y = clock.getElapsedTime() * 0.05;
            mesh.current.rotation.x = pointer.y * 0.1;
            mesh.current.rotation.z = pointer.x * 0.1;
        }
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particlesPosition.length / 3}
                    array={particlesPosition}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.02}
                color="#2D7DFF"
                sizeAttenuation={true}
                transparent={true}
                opacity={0.6}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

export default ParticlesBackground;
