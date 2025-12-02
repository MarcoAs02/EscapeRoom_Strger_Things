import { useEscapeGame, Difficulty, DIFFICULTY_SETTINGS } from "@/lib/stores/useEscapeGame";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Leaderboard } from "./Leaderboard";

const DIFFICULTY_INFO: Record<Difficulty, { label: string; description: string; color: string }> = {
  easy: { label: "EASY", description: "More time, slower enemies", color: "#22c55e" },
  medium: { label: "MEDIUM", description: "Standard challenge", color: "#f59e0b" },
  hard: { label: "HARD", description: "Less time, faster enemies", color: "#ef4444" },
};

export function MainMenu() {
  const { startGame } = useEscapeGame();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const particles = useMemo(() => 
    Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 2,
    })), []
  );

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-red-900/20 via-black to-black" />
      
      <div className="absolute inset-0 opacity-10">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-red-500 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center"
      >
        <h1 
          className="text-6xl md:text-8xl font-bold mb-4 tracking-wider"
          style={{
            fontFamily: "'Courier New', monospace",
            color: "#ff0000",
            textShadow: "0 0 20px #ff0000, 0 0 40px #ff0000, 0 0 60px #ff0000",
          }}
        >
          ESCAPE
        </h1>
        <h2 
          className="text-3xl md:text-5xl font-bold mb-2 tracking-widest"
          style={{
            fontFamily: "'Courier New', monospace",
            color: "#ff4444",
            textShadow: "0 0 10px #ff4444, 0 0 20px #ff4444",
          }}
        >
          THE UPSIDE DOWN
        </h2>
        <p className="text-red-400 text-lg mt-4 tracking-wide" style={{ fontFamily: "'Courier New', monospace" }}>
          A STRANGER THINGS ESCAPE ROOM
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 mt-8"
      >
        <p className="text-red-400/80 text-sm mb-3 text-center tracking-widest" style={{ fontFamily: "'Courier New', monospace" }}>
          SELECT DIFFICULTY
        </p>
        <div className="flex gap-3">
          {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => {
            const info = DIFFICULTY_INFO[diff];
            const isSelected = selectedDifficulty === diff;
            return (
              <motion.button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className="px-4 py-2 text-sm font-bold tracking-wider border-2 transition-all duration-200"
                style={{ 
                  fontFamily: "'Courier New', monospace",
                  borderColor: isSelected ? info.color : "#4b5563",
                  backgroundColor: isSelected ? `${info.color}20` : "transparent",
                  color: isSelected ? info.color : "#9ca3af",
                  boxShadow: isSelected ? `0 0 15px ${info.color}40` : "none",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {info.label}
              </motion.button>
            );
          })}
        </div>
        <p className="text-center text-xs mt-2 tracking-wide" 
           style={{ fontFamily: "'Courier New', monospace", color: DIFFICULTY_INFO[selectedDifficulty].color }}>
          {DIFFICULTY_INFO[selectedDifficulty].description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative z-10 mt-8 flex flex-col gap-4"
      >
        <motion.button
          onClick={() => startGame(selectedDifficulty)}
          className="px-12 py-4 text-2xl font-bold tracking-widest border-2 border-red-600 text-red-500 bg-black/80 hover:bg-red-600 hover:text-white transition-all duration-300"
          style={{ fontFamily: "'Courier New', monospace" }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255, 0, 0, 0.5)" }}
          whileTap={{ scale: 0.95 }}
        >
          ENTER THE VOID
        </motion.button>
        
        <motion.button
          onClick={() => setShowLeaderboard(true)}
          className="px-8 py-2 text-lg font-bold tracking-widest border border-yellow-600 text-yellow-500 bg-black/60 hover:bg-yellow-600 hover:text-black transition-all duration-300"
          style={{ fontFamily: "'Courier New', monospace" }}
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(255, 200, 0, 0.3)" }}
          whileTap={{ scale: 0.98 }}
        >
          HIGH SCORES
        </motion.button>
      </motion.div>
      
      <AnimatePresence>
        {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-center text-red-400/60 text-sm"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        <p>5 LEVELS • ESCAPE BEFORE TIME RUNS OUT</p>
        <p className="mt-2">OR FACE THE DEMOGORGON...</p>
      </motion.div>

      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />
    </div>
  );
}
