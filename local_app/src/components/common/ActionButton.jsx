import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

const MotionButton = motion(Button);

const ActionButton = React.forwardRef(({ onClick, disabled, className, children, icon: IconName }, ref) => {
  const Icon = IconName && LucideIcons[IconName] ? LucideIcons[IconName] : null;

  return (
    <MotionButton
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={cn(`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl text-white font-semibold transition-all duration-300`, className, `disabled:bg-gray-400 disabled:cursor-not-allowed`)}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {Icon && <Icon className="w-7 h-7 mb-1" />}
      <span className="text-sm">{children}</span>
    </MotionButton>
  );
});

ActionButton.displayName = 'ActionButton';

export default ActionButton;