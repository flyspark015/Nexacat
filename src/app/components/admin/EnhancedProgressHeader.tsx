import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ProgressCheckpoint {
  id: string;
  label: string;
  icon: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

interface EnhancedProgressHeaderProps {
  checkpoints: ProgressCheckpoint[];
  currentStepLabel?: string;
  percentage: number;
  show: boolean;
}

export function EnhancedProgressHeader({ 
  checkpoints, 
  currentStepLabel, 
  percentage, 
  show 
}: EnhancedProgressHeaderProps) {
  if (!show) return null;

  const activeStep = checkpoints.find(cp => cp.status === 'active');
  const displayLabel = currentStepLabel || activeStep?.label || 'Processing';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -30, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -30, height: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg pb-6 pt-4 px-6"
      >
        {/* Header Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-accent animate-spin" />
              <span className="font-semibold text-sm">
                Current: <span className="text-blue-accent">{displayLabel}</span>
              </span>
            </div>
          </div>
          <div className="text-sm font-bold text-blue-accent">
            {Math.round(percentage)}%
          </div>
        </div>

        {/* Progress Bar with Checkpoints */}
        <div className="relative">
          {/* Main Progress Bar */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-4">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-accent via-blue-500 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          {/* Checkpoint Dots */}
          <div className="flex items-center justify-between gap-1 px-1">
            {checkpoints.map((checkpoint, index) => {
              const isActive = checkpoint.status === 'active';
              const isComplete = checkpoint.status === 'complete';
              const isError = checkpoint.status === 'error';
              const isPending = checkpoint.status === 'pending';

              return (
                <div key={checkpoint.id} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  {/* Checkpoint Circle */}
                  <motion.div
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all shadow-md ${
                      isComplete
                        ? 'bg-green-500 border-green-500 shadow-green-500/30'
                        : isActive
                        ? 'bg-blue-accent border-blue-accent shadow-blue-accent/30'
                        : isError
                        ? 'bg-destructive border-destructive shadow-destructive/30'
                        : 'bg-background border-border'
                    }`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ 
                      scale: isActive ? 1.15 : 1,
                      opacity: 1
                    }}
                    transition={{ 
                      scale: { duration: 0.3, type: 'spring' },
                      opacity: { duration: 0.2 }
                    }}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <span className="text-base">{checkpoint.icon}</span>
                    )}
                    
                    {/* Active pulse effect */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-blue-accent/30"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Label */}
                  <motion.span
                    className={`text-xs text-center font-medium transition-all px-1 truncate w-full ${
                      isComplete
                        ? 'text-green-600 dark:text-green-400'
                        : isActive
                        ? 'text-blue-accent font-semibold'
                        : isError
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}
                    animate={{
                      scale: isActive ? 1.05 : 1,
                    }}
                  >
                    {checkpoint.label}
                  </motion.span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
