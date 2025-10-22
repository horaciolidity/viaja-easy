import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Volume2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NavigationControls = ({ currentStep, onPrev, onNext, onRepeat }) => {
  if (!currentStep) return null;

  const instructionText = currentStep.instructions.replace(/<[^>]*>?/gm, ' ');

  return (
    <motion.div
      initial={{ y: -150 }}
      animate={{ y: 0 }}
      exit={{ y: -150 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute top-4 left-4 right-4 bg-gray-900 text-white p-4 shadow-lg z-20 rounded-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start flex-1 min-w-0">
          <ArrowRight className="h-10 w-10 mr-4 mt-1 text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-2xl font-bold truncate">{instructionText}</p>
            <p className="text-lg text-gray-300">{currentStep.distance.text} ({currentStep.duration.text})</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4">
          <Button variant="ghost" size="icon" onClick={onPrev} className="text-white hover:bg-gray-700 rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onRepeat} className="text-white hover:bg-gray-700 rounded-full">
            <Volume2 className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext} className="text-white hover:bg-gray-700 rounded-full">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default NavigationControls;