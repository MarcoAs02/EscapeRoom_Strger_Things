import { useEscapeGame } from "@/lib/stores/useEscapeGame";
import { motion } from "framer-motion";

export function RetryScreen() {
  const { retry, resetGame, currentLevel, score } = useEscapeGame();

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-red-900/30 via-black to-black" />
      
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center"
      >
        <motion.h1 
          className="text-6xl md:text-8xl font-bold mb-4 tracking-wider"
          style={{
            fontFamily: "'Courier New', monospace",
            color: "#ff0000",
            textShadow: "0 0 20px #ff0000, 0 0 40px #ff0000",
          }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          GAME OVER
        </motion.h1>
        
        <p 
          className="text-xl text-red-400 mb-8"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          THE DEMOGORGON GOT YOU...
        </p>

        <div className="bg-black/60 border border-red-600 px-8 py-4 mb-8 inline-block">
          <p className="text-red-400 text-sm tracking-widest mb-2" style={{ fontFamily: "'Courier New', monospace" }}>
            LEVEL {currentLevel} • SCORE: {score.toLocaleString()}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative z-10 flex flex-col gap-4"
      >
        <motion.button
          onClick={retry}
          className="px-12 py-4 text-xl font-bold tracking-widest border-2 border-red-600 text-red-500 bg-black/80 hover:bg-red-600 hover:text-white transition-all duration-300"
          style={{ fontFamily: "'Courier New', monospace" }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255, 0, 0, 0.5)" }}
          whileTap={{ scale: 0.95 }}
        >
          TRY AGAIN
        </motion.button>

        <motion.button
          onClick={resetGame}
          className="px-12 py-4 text-lg font-bold tracking-widest border-2 border-gray-600 text-gray-400 bg-black/80 hover:bg-gray-600 hover:text-white transition-all duration-300"
          style={{ fontFamily: "'Courier New', monospace" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          MAIN MENU
        </motion.button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-red-400/60 text-sm"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        ESCAPE BEFORE TIME RUNS OUT...
      </motion.p>
    </div>
  );
}
