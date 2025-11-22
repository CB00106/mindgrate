import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface CTAButtonsProps {
    primaryText: string;
    secondaryText: string;
    onPrimaryClick?: () => void;
    onSecondaryClick?: () => void;
}

const CTAButtons: React.FC<CTAButtonsProps> = ({
    primaryText,
    secondaryText,
    onPrimaryClick,
    onSecondaryClick,
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 bg-white text-black rounded-full font-semibold flex items-center justify-center gap-2 overflow-hidden"
                onClick={onPrimaryClick}
            >
                <span className="relative z-10">{primaryText}</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            </motion.button>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-full font-semibold hover:bg-white/10 transition-colors"
                onClick={onSecondaryClick}
            >
                {secondaryText}
            </motion.button>
        </div>
    );
};

export default CTAButtons;
