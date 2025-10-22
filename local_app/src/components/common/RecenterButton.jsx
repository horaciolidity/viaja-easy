import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';

const RecenterButton = ({ show, onClick, className = '' }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`absolute top-5 right-5 z-30 ${className}`}
        >
          <Button
            onClick={onClick}
            variant="secondary"
            className="rounded-full h-12 w-12 p-0 shadow-lg bg-white hover:bg-slate-100"
          >
            <LocateFixed className="w-6 h-6 text-slate-700" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RecenterButton;