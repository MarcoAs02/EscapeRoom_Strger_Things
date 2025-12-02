import { useEscapeGame, Difficulty } from "@/lib/stores/useEscapeGame";
import { useEffect } from "react";
import { motion } from "framer-motion";

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "#22c55e",
  medium: "#f59e0b",
  hard: "#ef4444",
};

export function GameUI() {
  const { timeRemaining, maxTime, currentLevel, score, decrementTime, isTimerRunning, difficulty } = useEscapeGame();

  useEffect(() => {
    if (!isTimerRunning) return;
    
    const interval = setInterval(() => {
      decrementTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [decrementTime, isTimerRunning]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timePercentage = (timeRemaining / maxTime) * 100;
  const isLowTime = timeRemaining <= 30;
  const isCriticalTime = timeRemaining <= 10;

  const getLevelName = (level: number) => {
    switch (level) {
      case 1: return "THE BYERS HOUSE";
      case 2: return "HAWKINS LAB";
      case 3: return "THE UPSIDE DOWN";
      case 4: return "THE ARCADE - PACMAN";
      case 5: return "VECNA'S LAIR - SPACE INVADERS";
      default: return "UNKNOWN";
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start">
          <motion.div 
            className="bg-black/80 border border-red-600 px-4 py-2"
            animate={isLowTime ? { borderColor: ["#dc2626", "#ff0000", "#dc2626"] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <p className="text-red-400 text-xs tracking-widest mb-1" style={{ fontFamily: "'Courier New', monospace" }}>
              LEVEL {currentLevel}
            </p>
            <p className="text-white text-sm tracking-wider" style={{ fontFamily: "'Courier New', monospace" }}>
              {getLevelName(currentLevel)}
            </p>
          </motion.div>

          <motion.div 
            className="bg-black/80 border border-red-600 px-6 py-2 text-center"
            animate={isCriticalTime ? { 
              scale: [1, 1.05, 1],
              borderColor: ["#dc2626", "#ff0000", "#dc2626"],
            } : {}}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            <p className="text-red-400 text-xs tracking-widest mb-1" style={{ fontFamily: "'Courier New', monospace" }}>
              TIME REMAINING
            </p>
            <p 
              className={`text-3xl font-bold tracking-widest ${isCriticalTime ? 'text-red-500' : isLowTime ? 'text-yellow-500' : 'text-white'}`}
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <div className="w-full h-1 bg-gray-800 mt-2">
              <motion.div 
                className={`h-full ${isCriticalTime ? 'bg-red-600' : isLowTime ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${timePercentage}%` }}
                animate={isCriticalTime ? { opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 0.3, repeat: Infinity }}
              />
            </div>
          </motion.div>

          <div className="bg-black/80 border border-red-600 px-4 py-2">
            <p className="text-red-400 text-xs tracking-widest mb-1" style={{ fontFamily: "'Courier New', monospace" }}>
              SCORE
            </p>
            <p className="text-white text-xl font-bold tracking-wider" style={{ fontFamily: "'Courier New', monospace" }}>
              {score.toLocaleString()}
            </p>
            <p 
              className="text-xs tracking-widest mt-1 uppercase"
              style={{ fontFamily: "'Courier New', monospace", color: DIFFICULTY_COLORS[difficulty] }}
            >
              {difficulty}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
