import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  footer
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className={`relative w-full ${sizes[size]} my-8`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-strong rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="relative px-6 py-5 border-b border-dark-200 dark:border-dark-800">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-primary-600/10" />
                    
                    <div className="relative flex items-center justify-between">
                      {title && (
                        <h3 className="text-2xl font-bold text-dark-900 dark:text-dark-50">
                          {title}
                        </h3>
                      )}
                      {showCloseButton && (
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={onClose}
                          className="ml-auto w-10 h-10 rounded-xl bg-dark-100 dark:bg-dark-800 
                                   flex items-center justify-center text-dark-600 dark:text-dark-400
                                   hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
                        >
                          <X size={20} />
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}

                {/* Body */}
                <div className="px-6 py-6">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="px-6 py-4 border-t border-dark-200 dark:border-dark-800 bg-dark-50 dark:bg-dark-900/50">
                    {footer}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;