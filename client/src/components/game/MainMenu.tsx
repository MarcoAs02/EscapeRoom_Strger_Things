import { useEscapeGame } from "@/lib/stores/useEscapeGame";
import { motion } from "framer-motion";

export function MainMenu() {
  const { startGame } = useEscapeGame();

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-red-900/20 via-black to-black" />
      
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-red-500 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
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
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative z-10 mt-12"
      >
        <motion.button
          onClick={startGame}
          className="px-12 py-4 text-2xl font-bold tracking-widest border-2 border-red-600 text-red-500 bg-black/80 hover:bg-red-600 hover:text-white transition-all duration-300"
          style={{ fontFamily: "'Courier New', monospace" }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255, 0, 0, 0.5)" }}
          whileTap={{ scale: 0.95 }}
        >
          ENTER THE VOID
        </motion.button>
      </motion.div>

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
