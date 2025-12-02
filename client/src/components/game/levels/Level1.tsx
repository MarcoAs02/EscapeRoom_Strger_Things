import { useState, useEffect } from "react";
import { useEscapeGame } from "@/lib/stores/useEscapeGame";
import { motion, AnimatePresence } from "framer-motion";

const CHRISTMAS_LIGHTS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
const SECRET_SEQUENCE = [2, 5, 1, 4, 0, 3]; // Pattern to discover

export function Level1() {
  const { completeLevel, triggerJumpscare, addScore } = useEscapeGame();
  const [litLights, setLitLights] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [message, setMessage] = useState("Click the Christmas lights in the correct order to spell a message...");
  const [wrongAttempts, setWrongAttempts] = useState(0);

  useEffect(() => {
    const flickerInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const randomLight = Math.floor(Math.random() * CHRISTMAS_LIGHTS.length);
        setLitLights(prev => {
          if (prev.includes(randomLight)) return prev.filter(l => l !== randomLight);
          return [...prev, randomLight];
        });
      }
    }, 500);

    return () => clearInterval(flickerInterval);
  }, []);

  useEffect(() => {
    if (showHint && hintIndex < SECRET_SEQUENCE.length) {
      const timeout = setTimeout(() => {
        setLitLights([SECRET_SEQUENCE[hintIndex]]);
        setHintIndex(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timeout);
    } else if (showHint && hintIndex >= SECRET_SEQUENCE.length) {
      setShowHint(false);
      setHintIndex(0);
      setLitLights([]);
    }
  }, [showHint, hintIndex]);

  const handleLightClick = (index: number) => {
    const newSequence = [...playerSequence, index];
    setPlayerSequence(newSequence);
    setLitLights([index]);

    const hitSound = new Audio('/sounds/hit.mp3');
    hitSound.volume = 0.3;
    hitSound.play().catch(() => {});

    if (newSequence.length <= SECRET_SEQUENCE.length) {
      const isCorrect = newSequence.every((val, idx) => val === SECRET_SEQUENCE[idx]);
      
      if (!isCorrect) {
        setMessage("Wrong sequence! The lights flicker angrily...");
        setPlayerSequence([]);
        setWrongAttempts(prev => prev + 1);
        
        if (wrongAttempts >= 4) {
          triggerJumpscare();
          return;
        }
      } else if (newSequence.length === SECRET_SEQUENCE.length) {
        addScore(200);
        setMessage("R-U-N! The message reveals itself! The door unlocks!");
        setTimeout(() => {
          completeLevel();
        }, 2000);
      } else {
        setMessage(`${newSequence.length}/${SECRET_SEQUENCE.length} lights activated...`);
      }
    }
  };

  const requestHint = () => {
    setShowHint(true);
    setHintIndex(0);
    setMessage("Watch carefully... the lights spell out a message...");
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: "linear-gradient(to bottom, #1a0a0a, #0a0505)" }}>
      <div className="absolute inset-0 opacity-30">
        <img src="/textures/wood.jpg" alt="" className="w-full h-full object-cover" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 text-center mb-8"
      >
        <h2 
          className="text-3xl font-bold text-red-500 mb-2"
          style={{ fontFamily: "'Courier New', monospace", textShadow: "0 0 10px #ff0000" }}
        >
          THE BYERS HOUSE
        </h2>
        <p className="text-gray-400" style={{ fontFamily: "'Courier New', monospace" }}>
          {message}
        </p>
      </motion.div>

      <div className="relative z-10 flex flex-wrap justify-center gap-4 max-w-2xl px-4">
        {CHRISTMAS_LIGHTS.map((color, index) => (
          <motion.button
            key={index}
            onClick={() => handleLightClick(index)}
            className="relative w-16 h-24 flex flex-col items-center cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="w-1 h-8 bg-green-900" />
            <motion.div
              className="w-12 h-16 rounded-full relative"
              style={{
                background: litLights.includes(index) 
                  ? `radial-gradient(circle, ${color}, ${color}88)` 
                  : `radial-gradient(circle, ${color}44, ${color}22)`,
                boxShadow: litLights.includes(index) 
                  ? `0 0 20px ${color}, 0 0 40px ${color}` 
                  : 'none',
              }}
              animate={litLights.includes(index) ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <div 
                className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-3 rounded-b-full"
                style={{ background: litLights.includes(index) ? 'white' : '#ffffff33' }}
              />
            </motion.div>
            <p 
              className="text-xs text-gray-500 mt-1"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              {String.fromCharCode(65 + index)}
            </p>
          </motion.button>
        ))}
      </div>

      <motion.button
        onClick={requestHint}
        disabled={showHint}
        className="relative z-10 mt-8 px-6 py-2 text-sm border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-all disabled:opacity-50"
        style={{ fontFamily: "'Courier New', monospace" }}
        whileHover={{ scale: 1.05 }}
      >
        {showHint ? "WATCHING..." : "SHOW HINT (-50 points)"}
      </motion.button>

      <div className="relative z-10 mt-8 text-center">
        <p className="text-gray-500 text-sm" style={{ fontFamily: "'Courier New', monospace" }}>
          Progress: {playerSequence.length}/{SECRET_SEQUENCE.length}
        </p>
        <p className="text-red-500 text-xs mt-2" style={{ fontFamily: "'Courier New', monospace" }}>
          Wrong attempts: {wrongAttempts}/5
        </p>
      </div>

      <AnimatePresence>
        {wrongAttempts > 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-4 right-4 text-center text-red-400 text-xs"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            The Demogorgon senses your presence... hurry!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
