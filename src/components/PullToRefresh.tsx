import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  isRefreshing: boolean;
  pullDistance: number;
  isTriggered: boolean;
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({
  isRefreshing,
  pullDistance,
  isTriggered,
  children,
  disabled = false
}: PullToRefreshProps) {
  const progress = Math.min(pullDistance / 80, 1);

  return (
    <div className="relative">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200",
          isTriggered 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground"
        )}>
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : 0,
            }}
            transition={{
              duration: isRefreshing ? 1 : 0,
              repeat: isRefreshing ? Infinity : 0,
              ease: "linear"
            }}
          >
            <RefreshCw 
              size={16} 
              style={{
                transform: `scale(${0.5 + progress * 0.5})`,
              }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{
          transform: `translateY(${pullDistance * 0.3}px)`,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}