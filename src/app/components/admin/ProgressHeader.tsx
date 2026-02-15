import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export interface ProgressCheckpoint {
  id: string;
  label: string;
  icon: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

interface ProgressHeaderProps {
  checkpoints: ProgressCheckpoint[];
  currentStep?: number;
  show: boolean;
}

export function ProgressHeader({ checkpoints, currentStep = 0, show }: ProgressHeaderProps) {
  if (!show) return null;

  const completedCount = checkpoints.filter(cp => cp.status === 'complete').length;
  const progressPercentage = (completedCount / checkpoints.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="sticky top-0 z-40 bg-gradient-to-b from-background via-background to-background/80 backdrop-blur-sm border-b border-border pb-4 mb-4"
    >
      {/* Progress Bar */}
      <div className="relative h-1 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-accent to-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Checkpoints */}
      <div className="flex items-center justify-between gap-2 px-2">
        {checkpoints.map((checkpoint, index) => {
          const isActive = checkpoint.status === 'active';
          const isComplete = checkpoint.status === 'complete';
          const isError = checkpoint.status === 'error';
          const isPending = checkpoint.status === 'pending';

          return (
            <div key={checkpoint.id} className="flex items-center gap-2 flex-1">
              {/* Checkpoint Circle */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <motion.div
                  className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                    isComplete
                      ? 'bg-green-500 border-green-500'
                      : isActive
                      ? 'bg-blue-accent border-blue-accent'
                      : isError
                      ? 'bg-destructive border-destructive'
                      : 'bg-background border-border'
                  }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <span className="text-xs">{checkpoint.icon}</span>
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className={`text-xs text-center font-medium transition-colors ${
                    isComplete
                      ? 'text-green-600 dark:text-green-400'
                      : isActive
                      ? 'text-blue-accent'
                      : isError
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {checkpoint.label}
                </span>
              </div>

              {/* Connecting Line */}
              {index < checkpoints.length - 1 && (
                <div className="flex-1 h-0.5 bg-border relative overflow-hidden -mx-2">
                  {isComplete && (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
