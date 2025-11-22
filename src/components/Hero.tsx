import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import Hero3D from './Hero3D';
import ParticlesBackground from './ParticlesBackground';
import CTAButtons from './CTAButtons';

const Hero: React.FC = () => {
    return (
        <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black text-white pt-20">
            {/* 3D Background & Hero Object */}
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                    <Suspense fallback={null}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1} />
                        <ParticlesBackground />
                        <group position={[2, 0, 0]} className="hidden md:block">
                            {/* Positioned to the right for desktop */}
                            <Hero3D />
                        </group>
                        {/* Mobile centered simplified version or just particles */}
                        <Environment preset="city" />
                    </Suspense>
                </Canvas>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="flex flex-col items-start">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-5xl md:text-7xl font-bold leading-tight tracking-tighter mb-6"
                    >
                        Una infraestructura <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                            colaborativa de IA
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="text-lg md:text-xl text-gray-400 max-w-lg mb-8"
                    >
                        Una red de agentes expertos que colaboran bajo tu control.
                        Potencia tus ideas con inteligencia colectiva.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    >
                        <CTAButtons
                            primaryText="Prueba el MVP"
                            secondaryText="Comparte tu Opinión"
                            onPrimaryClick={() => console.log('MVP Clicked')}
                            onSecondaryClick={() => console.log('Feedback Clicked')}
                        />
                    </motion.div>
                </div>

                {/* Spacer for 3D object on desktop */}
                <div className="hidden md:block h-full min-h-[500px]"></div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
            >
                <span className="text-xs text-gray-500 uppercase tracking-widest">Scroll</span>
                <motion.div
                    className="w-1 h-12 bg-gradient-to-b from-blue-500 to-transparent rounded-full"
                    animate={{ scaleY: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>
        </section>
    );
};

export default Hero;
