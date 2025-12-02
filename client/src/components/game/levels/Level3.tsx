import { useState, useEffect } from "react";
import { useEscapeGame } from "@/lib/stores/useEscapeGame";
import { motion, AnimatePresence } from "framer-motion";

interface Puzzle {
  question: string;
  options: string[];
  correct: number;
  hint: string;
}

const PUZZLES: Puzzle[] = [
  {
    question: "What creature hunts by sound in the Upside Down?",
    options: ["Mind Flayer", "Demogorgon", "Vecna", "Demodogs"],
    correct: 1,
    hint: "It has no eyes and opens like a flower..."
  },
  {
    question: "What song saved Max from Vecna?",
    options: ["Thriller", "Running Up That Hill", "Should I Stay or Should I Go", "Never Ending Story"],
    correct: 1,
    hint: "A Kate Bush classic from the 80s..."
  },
  {
    question: "What is Eleven's real name?",
    options: ["Jane", "Joyce", "Jennifer", "Janet"],
    correct: 0,
    hint: "A simple name given by her mother..."
  },
  {
    question: "Complete the sequence: 8, 11, ?",
    options: ["13", "14", "15", "1"],
    correct: 3,
    hint: "Think about the experiment subjects..."
  },
];

export function Level3() {
  const { completeLevel, triggerJumpscare, addScore } = useEscapeGame();
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [message, setMessage] = useState("Answer the riddles to find your way through the darkness...");
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [particles, setParticles] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => {
        const newParticles = [...prev];
        if (newParticles.length < 20) {
          newParticles.push({
            x: Math.random() * 100,
            y: Math.random() * 100,
            id: Date.now() + Math.random(),
          });
        }
        return newParticles.slice(-20);
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleAnswer = (answerIndex: number) => {
    const puzzle = PUZZLES[currentPuzzle];
    
    const hitSound = new Audio('/sounds/hit.mp3');
    hitSound.volume = 0.3;
    hitSound.play().catch(() => {});

    if (answerIndex === puzzle.correct) {
      addScore(100);
      setMessage("Correct! The darkness recedes slightly...");
      setShowHint(false);

      if (currentPuzzle + 1 >= PUZZLES.length) {
        setMessage("The portal opens! You've found the way through!");
        setTimeout(() => {
          completeLevel();
        }, 2000);
      } else {
        setTimeout(() => {
          setCurrentPuzzle(prev => prev + 1);
          setMessage("Answer the riddles to find your way through the darkness...");
        }, 1500);
      }
    } else {
      setWrongAnswers(prev => prev + 1);
      setMessage("Wrong answer! The Upside Down grows stronger...");

      if (wrongAnswers >= 4) {
        triggerJumpscare();
        return;
      }
    }
  };

  const puzzle = PUZZLES[currentPuzzle];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ background: "linear-gradient(to bottom, #0a0a1a, #050510)" }}>
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-purple-500 rounded-full"
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.5, 0],
              scale: [0, 1, 0],
              y: [-20, 20],
            }}
            transition={{ duration: 3 }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 text-center mb-6"
      >
        <h2 
          className="text-3xl font-bold text-purple-400 mb-2"
          style={{ fontFamily: "'Courier New', monospace", textShadow: "0 0 10px #9333ea" }}
        >
          THE UPSIDE DOWN
        </h2>
        <p className="text-purple-300 text-sm" style={{ fontFamily: "'Courier New', monospace" }}>
          {message}
        </p>
        <p className="text-gray-500 text-xs mt-2" style={{ fontFamily: "'Courier New', monospace" }}>
          Riddle {currentPuzzle + 1} of {PUZZLES.length}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPuzzle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative z-10 max-w-xl px-4"
        >
          <div className="bg-black/60 border border-purple-600 p-6 rounded-lg mb-6">
            <p 
              className="text-xl text-white text-center mb-6"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              {puzzle.question}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {puzzle.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="px-4 py-3 bg-purple-900/50 border border-purple-500 text-purple-200 hover:bg-purple-600 hover:text-white transition-all"
                  style={{ fontFamily: "'Courier New', monospace" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.button
        onClick={() => setShowHint(!showHint)}
        className="relative z-10 px-6 py-2 text-sm border border-purple-600 text-purple-400 hover:text-white hover:border-white transition-all"
        style={{ fontFamily: "'Courier New', monospace" }}
        whileHover={{ scale: 1.05 }}
      >
        {showHint ? "HIDE HINT" : "SHOW HINT"}
      </motion.button>

      <AnimatePresence>
        {showHint && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 mt-4 text-purple-300 text-sm italic"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            "{puzzle.hint}"
          </motion.p>
        )}
      </AnimatePresence>

      <div className="relative z-10 mt-6 text-center">
        <p className="text-red-400 text-xs" style={{ fontFamily: "'Courier New', monospace" }}>
          WRONG ANSWERS: {wrongAnswers}/5
        </p>
      </div>

      {wrongAnswers >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 text-center text-red-400 text-sm"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          Something is hunting you in the darkness...
        </motion.div>
      )}
    </div>
  );
}
