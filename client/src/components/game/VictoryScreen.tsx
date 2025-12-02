import { useEscapeGame } from "@/lib/stores/useEscapeGame";
import { motion } from "framer-motion";
import ReactConfetti from "react-confetti";
import { useEffect, useState } from "react";

export function VictoryScreen() {
  const { resetGame, score } = useEscapeGame();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    const successAudio = new Audio('/sounds/success.mp3');
    successAudio.volume = 0.6;
    successAudio.play().catch(() => {});

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      <ReactConfetti
        width={windowSize.width}
        height={windowSize.height}
        colors={['#ff0000', '#ff4444', '#ffff00', '#ff8800', '#ffffff']}
        recycle={true}
        numberOfPieces={200}
      />
      
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-black" />
      
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.5 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, type: "spring" }}
        className="relative z-10 text-center"
      >
        <motion.h1 
          className="text-5xl md:text-7xl font-bold mb-4 tracking-wider"
          style={{
            fontFamily: "'Courier New', monospace",
            color: "#ffff00",
            textShadow: "0 0 20px #ffff00, 0 0 40px #ff8800, 0 0 60px #ff0000",
          }}
          animate={{ 
            textShadow: [
              "0 0 20px #ffff00, 0 0 40px #ff8800, 0 0 60px #ff0000",
              "0 0 30px #ffff00, 0 0 50px #ff8800, 0 0 70px #ff0000",
              "0 0 20px #ffff00, 0 0 40px #ff8800, 0 0 60px #ff0000",
            ]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          VICTORY!
        </motion.h1>
        
        <motion.p 
          className="text-2xl text-purple-300 mb-4"
          style={{ fontFamily: "'Courier New', monospace" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          YOU ESCAPED THE UPSIDE DOWN!
        </motion.p>

        <motion.p 
          className="text-lg text-gray-300 mb-8"
          style={{ fontFamily: "'Courier New', monospace" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          VECNA HAS BEEN DEFEATED!
        </motion.p>

        <motion.div 
          className="bg-black/60 border-2 border-yellow-500 px-12 py-6 mb-8 inline-block"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
        >
          <p className="text-yellow-400 text-sm tracking-widest mb-2" style={{ fontFamily: "'Courier New', monospace" }}>
            FINAL SCORE
          </p>
          <p 
            className="text-4xl font-bold text-white tracking-widest"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            {score.toLocaleString()}
          </p>
        </motion.div>
      </motion.div>

      <motion.button
        onClick={resetGame}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="relative z-10 px-12 py-4 text-xl font-bold tracking-widest border-2 border-yellow-500 text-yellow-400 bg-black/80 hover:bg-yellow-500 hover:text-black transition-all duration-300"
        style={{ fontFamily: "'Courier New', monospace" }}
        whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255, 255, 0, 0.5)" }}
        whileTap={{ scale: 0.95 }}
      >
        PLAY AGAIN
      </motion.button>
    </div>
  );
}
