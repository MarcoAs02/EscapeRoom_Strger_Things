import { useState } from "react";
import { useHighScores } from "@/lib/api/highscores";
import { motion } from "framer-motion";
import type { Difficulty } from "@/lib/stores/useEscapeGame";

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "#22c55e",
  medium: "#f59e0b",
  hard: "#ef4444",
};

interface LeaderboardProps {
  onClose: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "all">("all");
  
  const { data: scores, isLoading, error } = useHighScores(
    selectedDifficulty === "all" ? undefined : selectedDifficulty
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black border-2 border-red-600 p-6 max-w-lg w-full mx-4"
        style={{ boxShadow: "0 0 30px rgba(255, 0, 0, 0.3)" }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-2xl font-bold text-red-500 tracking-widest"
            style={{ 
              fontFamily: "'Courier New', monospace",
              textShadow: "0 0 10px #ff0000",
            }}
          >
            HIGH SCORES
          </h2>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 text-2xl"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(["all", "easy", "medium", "hard"] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1 text-xs tracking-wider border transition-all ${
                selectedDifficulty === diff
                  ? "border-red-500 bg-red-600/20 text-red-300"
                  : "border-gray-600 text-gray-400 hover:border-gray-500"
              }`}
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              {diff.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
          {isLoading && (
            <p className="text-center text-gray-500 py-8" style={{ fontFamily: "'Courier New', monospace" }}>
              LOADING...
            </p>
          )}

          {error && (
            <p className="text-center text-red-500 py-8" style={{ fontFamily: "'Courier New', monospace" }}>
              ERROR LOADING SCORES
            </p>
          )}

          {scores && scores.length === 0 && (
            <p className="text-center text-gray-500 py-8" style={{ fontFamily: "'Courier New', monospace" }}>
              NO SCORES YET. BE THE FIRST!
            </p>
          )}

          {scores && scores.map((score, index) => (
            <motion.div
              key={score.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 bg-gray-900/50 border border-gray-800 p-3"
            >
              <span 
                className="text-xl font-bold w-8 text-center"
                style={{ 
                  fontFamily: "'Courier New', monospace",
                  color: index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : index === 2 ? "#cd7f32" : "#666",
                }}
              >
                {index + 1}
              </span>
              
              <div className="flex-1 min-w-0">
                <p className="text-white truncate" style={{ fontFamily: "'Courier New', monospace" }}>
                  {score.playerName}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span 
                    className="uppercase"
                    style={{ 
                      fontFamily: "'Courier New', monospace",
                      color: DIFFICULTY_COLORS[score.difficulty as Difficulty] || "#666",
                    }}
                  >
                    {score.difficulty}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-500" style={{ fontFamily: "'Courier New', monospace" }}>
                    LVL {score.levelReached}
                  </span>
                  {score.completedGame && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-green-500" style={{ fontFamily: "'Courier New', monospace" }}>
                        ✓ WON
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p 
                  className="text-lg font-bold text-yellow-400"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  {score.score.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600" style={{ fontFamily: "'Courier New', monospace" }}>
                  {formatDate(score.createdAt.toString())}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={onClose}
          className="w-full mt-6 py-2 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all tracking-widest"
          style={{ fontFamily: "'Courier New', monospace" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          CLOSE
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
