import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const HelpButton = ({ onClick }) => {
  return (
    <motion.div
      className="fixed bottom-24 right-5 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring' }}
    >
      <Button
        onClick={onClick}
        size="icon"
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
      >
        <HelpCircle className="w-7 h-7" />
      </Button>
    </motion.div>
  );
};

export default HelpButton;