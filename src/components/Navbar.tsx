import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Mail } from 'lucide-react';
import logoImage from '@/images/icon.png';

const Navbar: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 50) {
            setIsScrolled(true);
        } else {
            setIsScrolled(false);
        }
    });

    const handleDownloadManifiesto = () => {
        // Placeholder para descarga de PDF
        console.log('Downloading Manifiesto PDF...');
        // TODO: Implementar descarga real del PDF
        window.open('/manifesto.pdf', '_blank');
    };

    return (
        <motion.nav
            className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'py-3 bg-white/80 backdrop-blur-md border-b border-gray-200/50' : 'py-6 bg-white/50 backdrop-blur-sm'
                }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container mx-auto px-6 flex justify-between items-center">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <img src={logoImage} alt="Mindgrate Logo" className="w-8 h-8 object-contain" />
                    <span className="text-xl font-extralight text-gray-900 tracking-tight">mindgrate</span>
                </div>

                {/* Links Centrales - Solo visible en desktop lg */}
                <div className="hidden lg:flex items-center gap-8">
                    <a
                        href="#investigacion"
                        className="text-sm font-light text-gray-600 hover:text-gray-900 transition-colors relative group"
                    >
                        La Trampa
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2383e2] transition-all group-hover:w-full" />
                    </a>
                    <a
                        href="#sia"
                        className="text-sm font-light text-gray-600 hover:text-gray-900 transition-colors relative group"
                    >
                        Arquitectura SIA
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2383e2] transition-all group-hover:w-full" />
                    </a>
                    <button
                        onClick={handleDownloadManifiesto}
                        className="text-sm font-light text-gray-600 hover:text-gray-900 transition-colors relative group"
                    >
                        Manifiesto
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2383e2] transition-all group-hover:w-full" />
                    </button>
                </div>

                {/* Acciones Derecha */}
                <div className="flex items-center gap-3">
                    {/* Botón Contacto - Ghost con icono Mail */}
                    <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-light text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                        <Mail className="w-4 h-4" />
                        <span>Contacto</span>
                    </button>

                    {/* Botón Acceso Beta - Primario Azul con sombra */}
                    <a
                        href="/login"
                        className="px-5 py-2.5 bg-[#2383e2] text-white text-sm font-medium rounded-xl hover:bg-[#1d6ab8] transition-all shadow-lg shadow-blue-200/50 hover:shadow-blue-300/60 hover:-translate-y-0.5"
                    >
                        Acceso Beta
                    </a>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;

