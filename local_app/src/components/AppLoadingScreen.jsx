import React from 'react';
import { motion } from 'framer-motion';

const logoUrl = "https://horizons-cdn.hostinger.com/b39e7321-a8b2-479d-ac5b-e21b810ac4d9/3a09a949b47cc959adb2761d2bc44da5.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.4,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

const dotVariants = {
  initial: {
    y: '0%',
  },
  animate: {
    y: '100%',
  },
  exit: {
    y: '0%',
  }
};

const AppLoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center"
      >
        <motion.div
          variants={itemVariants}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, type: 'spring', damping: 15 }}
        >
          <img src={logoUrl} alt="ViajaFacil Logo" className="h-48 w-auto mb-6" />
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="flex items-center space-x-2"
        >
          <span className="text-lg font-medium text-gray-600 dark:text-gray-300">Cargando</span>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.6s]"></div>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
        </motion.div>

        <motion.p
          variants={itemVariants}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400"
        >
          Preparando todo para tu viaje...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AppLoadingScreen;