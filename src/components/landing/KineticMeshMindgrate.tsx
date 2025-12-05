import React from 'react';
import KineticMesh from './KineticMesh';

const KineticMeshMindgrate: React.FC = () => {
    // Path de la silueta externa para la máscara
    const shapePath = "M76.5 6.5C54.9 -3.9 23.3 8.1 11.7 28.5C0.1 48.9 -5.9 83.3 14.5 98.9C34.9 114.5 70.9 118.1 90.1 101.3C109.3 84.5 116.1 49.3 107.7 28.5C99.3 7.7 98.1 16.9 76.5 6.5Z";

    // Las líneas internas y nodos (La red neuronal)
    const internalStructure = (
        <>
            <path d="M35 85 L85 25" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d="M85 25 L95 65 L65 50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M35 85 L65 50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <circle cx="35" cy="85" r="8" fill="currentColor" />
            <circle cx="85" cy="25" r="8" fill="currentColor" />
            <circle cx="50" cy="100" r="6" fill="currentColor" />
        </>
    );

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-[400px] h-[450px] group transition-transform duration-500 hover:scale-105">

                {/* CAPA 1: LA MÁSCARA Y EL MESH */}
                <div
                    className="absolute inset-0 z-10 overflow-hidden"
                    style={{ clipPath: `path('${shapePath}')` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-[#2383e2]/10 z-0" />
                    <KineticMesh color="#ffffff" />
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none mix-blend-overlay" />
                </div>

                {/* CAPA 2: BORDE EXTERNO Y ESTRUCTURA INTERNA */}
                <svg
                    viewBox="0 0 120 120"
                    className="absolute inset-0 w-full h-full z-20 pointer-events-none drop-shadow-2xl"
                    preserveAspectRatio="none"
                >
                    <g className="text-white/90">
                        <path
                            d={shapePath}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                        />
                        {internalStructure}
                    </g>
                    <path
                        d="M20 30 Q 40 10 70 15"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        className="opacity-60"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Sombra de elevación */}
                <div className="absolute -inset-4 bg-[#2383e2] opacity-30 blur-3xl -z-10 rounded-full group-hover:opacity-40 transition-opacity duration-500" />
            </div>
        </div>
    );
};

export default KineticMeshMindgrate;