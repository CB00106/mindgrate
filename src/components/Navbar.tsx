import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
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

    return (
        <motion.nav
            className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'py-3 bg-black/30 backdrop-blur-md border-b border-white/10' : 'py-6 bg-transparent'
                }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={logoImage} alt="Mindgrate Logo" className="w-8 h-8 object-contain" />
                    <span className="text-xl font-bold text-white tracking-tight">Mindgrate</span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    {['Features', 'Agents', 'Pricing', 'About'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-sm text-gray-300 hover:text-white transition-colors relative group"
                        >
                            {item}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full" />
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button className="hidden md:block text-sm text-white hover:text-blue-400 transition-colors">
                        Log in
                    </button>
                    <button className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isScrolled ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-black hover:bg-gray-200'
                        }`}>
                        Get Started
                    </button>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
