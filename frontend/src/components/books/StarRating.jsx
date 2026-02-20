import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const StarRating = ({ 
  rating = 0, 
  onChange, 
  readonly = false, 
  size = 'md',
  showValue = false 
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  const starSize = sizes[size];
  const displayRating = hoverRating || rating;

  const handleClick = (value) => {
    if (!readonly && onChange) {
      // Allow half-star ratings
      onChange(value);
    }
  };

  const handleMouseMove = (index, e) => {
    if (readonly || !onChange) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    
    setHoverRating(isHalf ? index - 0.5 : index);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const renderStar = (index) => {
    const filled = displayRating >= index;
    const half = displayRating >= index - 0.5 && displayRating < index;

    return (
      <motion.button
        key={index}
        type="button"
        onClick={() => handleClick(index)}
        onMouseMove={(e) => handleMouseMove(index, e)}
        onMouseLeave={handleMouseLeave}
        disabled={readonly}
        whileHover={!readonly ? { scale: 1.2 } : {}}
        whileTap={!readonly ? { scale: 0.9 } : {}}
        className={`relative transition-colors ${
          readonly ? 'cursor-default' : 'cursor-pointer'
        }`}
      >
        {/* Background star */}
        <Star
          size={starSize}
          className="text-dark-300 dark:text-dark-600"
          fill="currentColor"
        />

        {/* Filled star */}
        {filled && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0"
          >
            <Star
              size={starSize}
              className="text-yellow-400"
              fill="currentColor"
            />
          </motion.div>
        )}

        {/* Half star */}
        {half && !filled && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 overflow-hidden"
            style={{ width: '50%' }}
          >
            <Star
              size={starSize}
              className="text-yellow-400"
              fill="currentColor"
            />
          </motion.div>
        )}

        {/* Hover effect */}
        {!readonly && hoverRating >= index - 0.5 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -inset-1 bg-yellow-400/20 rounded-full blur-md -z-10"
          />
        )}
      </motion.button>
    );
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
      </div>
      
      {showValue && (
        <span className="ml-2 text-sm font-medium text-dark-600 dark:text-dark-400">
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;