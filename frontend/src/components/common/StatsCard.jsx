import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
  index = 0 
}) => {
  const colors = {
    primary: {
      bg: 'from-primary-500 to-primary-600',
      text: 'text-primary-600 dark:text-primary-400',
      ring: 'ring-primary-500/20'
    },
    success: {
      bg: 'from-green-500 to-green-600',
      text: 'text-green-600 dark:text-green-400',
      ring: 'ring-green-500/20'
    },
    warning: {
      bg: 'from-yellow-500 to-yellow-600',
      text: 'text-yellow-600 dark:text-yellow-400',
      ring: 'ring-yellow-500/20'
    },
    info: {
      bg: 'from-blue-500 to-blue-600',
      text: 'text-blue-600 dark:text-blue-400',
      ring: 'ring-blue-500/20'
    },
    favorite: {
      bg: 'from-pink-600 to-pink-700',
      text: 'text-pink-600 dark:text-pink-400',
      ring: 'ring-pink-500/20'
    }
  };

  const selectedColor = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="card hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${selectedColor.bg} opacity-5`} />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-dark-600 dark:text-dark-400">
              {title}
            </p>
            <p className="text-3xl font-bold text-dark-900 dark:text-dark-50">
              {value}
            </p>
            
            {/* Trend */}
            {trend && (
              <div className={`flex items-center gap-1 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="font-medium">{trendValue}</span>
              </div>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedColor.bg} 
                        flex items-center justify-center shadow-lg ${selectedColor.ring} ring-4`}
            >
              <Icon className="text-white" size={24} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;