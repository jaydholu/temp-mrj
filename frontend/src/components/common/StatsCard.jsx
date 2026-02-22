import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon: Icon, color = 'primary', trend, trendValue, index = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const previousValue = useRef(value);

  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    success: 'from-green-500 to-green-600',
    info: 'from-blue-500 to-blue-600',
    warning: 'from-orange-500 to-orange-600',
    favorite: 'from-red-500 to-red-600',
  };

  const bgColorClasses = {
    primary: 'bg-primary-50 dark:bg-primary-900/20',
    success: 'bg-green-50 dark:bg-green-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20',
    warning: 'bg-orange-50 dark:bg-orange-900/20',
    favorite: 'bg-red-50 dark:bg-red-900/20',
  };

  const iconColorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    success: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-orange-600 dark:text-orange-400',
    favorite: 'text-red-600 dark:text-red-400',
  };

  useEffect(() => {
    if (previousValue.current !== value) {
      const duration = 1000; // 1 second
      const steps = 50;
      const increment = (value - displayValue) / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep === steps) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(prev => prev + increment);
        }
      }, stepDuration);

      previousValue.current = value;
      setHasAnimated(true);

      return () => clearInterval(timer);
    } else if (!hasAnimated) {
      const duration = 1000;
      const steps = 50;
      const increment = value / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep === steps) {
          setDisplayValue(value);
          clearInterval(timer);
          setHasAnimated(true);
        } else {
          setDisplayValue(prev => prev + increment);
        }
      }, stepDuration);

      previousValue.current = value;

      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <motion.div
      initial={hasAnimated ? false : { opacity: 0, y: 20 }}
      animate={hasAnimated ? {} : { opacity: 1, y: 0 }}
      transition={hasAnimated ? {} : { delay: index * 0.1 }}
      className="card p-6 hover:shadow-xl transition-all duration-300 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-bold text-lg text-dark-500 dark:text-dark-500 mb-2">{title}</p>
          <h3 className="text-4xl font-bold text-dark-900 dark:text-dark-50">
            {Math.round(displayValue)}
          </h3>
          {trend && trendValue && (
            <div className={`mt-2 text-sm flex items-center gap-1 ${
              trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg transform 
                        group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>

      {/* Animated gradient border on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 -z-10"
        style={{
          background: `linear-gradient(135deg, ${colorClasses[color]})`,
          filter: 'blur(20px)',
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.3 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default StatsCard;