import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const FavoriteButton = ({ isFavorite, onToggle, size = 'md' }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const sizes = {
    sm: { button: 'w-8 h-8', icon: 18 },
    md: { button: 'w-10 h-10', icon: 20 },
    lg: { button: 'w-12 h-12', icon: 24 },
  };

  const { button, icon } = sizes[size];

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAnimating(true);
    onToggle();
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`${button} rounded-full glass-strong backdrop-blur-xl 
                flex items-center justify-center shadow-lg
                transition-all duration-200 relative overflow-hidden group`}
    >
      {/* Ripple effect */}
      {isAnimating && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-red-500/30 rounded-full"
        />
      )}

      {/* Heart icon */}
      <motion.div
        animate={isAnimating ? {
          scale: [1, 1.3, 1],
          rotate: [0, -10, 10, 0]
        } : {}}
        transition={{ duration: 0.6 }}
      >
        <Heart
          size={icon}
          className={`transition-colors duration-200 ${
            isFavorite 
              ? 'text-red-500 fill-red-500' 
              : 'text-dark-400 dark:text-dark-500 group-hover:text-red-500'
          }`}
        />
      </motion.div>

      {/* Particles */}
      {isAnimating && isFavorite && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 1, 
                opacity: 1 
              }}
              animate={{
                x: Math.cos((i * Math.PI * 2) / 8) * 30,
                y: Math.sin((i * Math.PI * 2) / 8) * 30,
                scale: 0,
                opacity: 0
              }}
              transition={{ duration: 0.6 }}
              className="absolute w-1 h-1 bg-red-500 rounded-full"
              style={{
                left: '50%',
                top: '50%',
              }}
            />
          ))}
        </>
      )}
    </motion.button>
  );
};

export default FavoriteButton;