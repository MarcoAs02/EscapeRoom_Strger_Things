import { useState, useEffect, useCallback } from "react";
import { useEscapeGame } from "@/lib/stores/useEscapeGame";
import { motion } from "framer-motion";

interface MemoryCard {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const SYMBOLS = ['011', '101', '110', '001', '100', '010'];

export function Level2() {
  const { completeLevel, triggerJumpscare, addScore } = useEscapeGame();
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [canFlip, setCanFlip] = useState(true);
  const [message, setMessage] = useState("Match the experiment codes to unlock the door...");
  const [mistakes, setMistakes] = useState(0);

  const initializeCards = useCallback(() => {
    const cardPairs: MemoryCard[] = [];
    SYMBOLS.forEach((symbol, index) => {
      cardPairs.push({ id: index * 2, symbol, isFlipped: false, isMatched: false });
      cardPairs.push({ id: index * 2 + 1, symbol, isFlipped: false, isMatched: false });
    });
    
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }
    
    setCards(cardPairs);
  }, []);

  useEffect(() => {
    initializeCards();
  }, [initializeCards]);

  const handleCardClick = (cardId: number) => {
    if (!canFlip) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const hitSound = new Audio('/sounds/hit.mp3');
    hitSound.volume = 0.2;
    hitSound.play().catch(() => {});

    const newCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setCanFlip(false);
      const [first, second] = newFlipped;
      const firstCard = newCards.find(c => c.id === first);
      const secondCard = newCards.find(c => c.id === second);

      if (firstCard && secondCard && firstCard.symbol === secondCard.symbol) {
        setCards(prev => prev.map(c => 
          c.id === first || c.id === second ? { ...c, isMatched: true } : c
        ));
        setMatchedPairs(prev => prev + 1);
        addScore(50);
        setMessage("Match found! Continue searching...");
        
        if (matchedPairs + 1 === SYMBOLS.length) {
          setMessage("All codes matched! Security override complete!");
          setTimeout(() => {
            completeLevel();
          }, 1500);
        }
        
        setFlippedCards([]);
        setCanFlip(true);
      } else {
        setMistakes(prev => prev + 1);
        setMessage("Codes don't match. The alarm triggers slightly...");
        
        if (mistakes >= 7) {
          triggerJumpscare();
          return;
        }

        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === first || c.id === second ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
          setCanFlip(true);
        }, 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: "linear-gradient(to bottom, #0a1a0a, #050a05)" }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 text-center mb-6"
      >
        <h2 
          className="text-3xl font-bold text-green-500 mb-2"
          style={{ fontFamily: "'Courier New', monospace", textShadow: "0 0 10px #00ff00" }}
        >
          HAWKINS LABORATORY
        </h2>
        <p className="text-green-300 text-sm" style={{ fontFamily: "'Courier New', monospace" }}>
          {message}
        </p>
      </motion.div>

      <div className="relative z-10 grid grid-cols-4 gap-3 max-w-lg px-4">
        {cards.map((card) => (
          <motion.button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`w-16 h-20 md:w-20 md:h-24 rounded border-2 flex items-center justify-center text-lg font-mono transition-all duration-300 ${
              card.isMatched 
                ? 'bg-green-600 border-green-400 cursor-default' 
                : card.isFlipped 
                  ? 'bg-gray-800 border-green-500' 
                  : 'bg-gray-900 border-gray-700 hover:border-green-500'
            }`}
            whileHover={!card.isFlipped && !card.isMatched ? { scale: 1.05 } : {}}
            whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
          >
            {(card.isFlipped || card.isMatched) ? (
              <span className="text-green-400 font-bold" style={{ fontFamily: "'Courier New', monospace" }}>
                {card.symbol}
              </span>
            ) : (
              <span className="text-gray-600">?</span>
            )}
          </motion.button>
        ))}
      </div>

      <div className="relative z-10 mt-6 text-center">
        <p className="text-green-400 text-sm" style={{ fontFamily: "'Courier New', monospace" }}>
          PAIRS MATCHED: {matchedPairs}/{SYMBOLS.length}
        </p>
        <p className="text-red-400 text-xs mt-2" style={{ fontFamily: "'Courier New', monospace" }}>
          SECURITY ALERTS: {mistakes}/8
        </p>
      </div>

      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 opacity-20">
        <div className="text-green-500 text-xs" style={{ fontFamily: "'Courier New', monospace" }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <p key={i}>{Math.random().toString(2).substring(2, 10)}</p>
          ))}
        </div>
      </div>

      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-20">
        <div className="text-green-500 text-xs" style={{ fontFamily: "'Courier New', monospace" }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <p key={i}>{Math.random().toString(2).substring(2, 10)}</p>
          ))}
        </div>
      </div>

      {mistakes >= 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="absolute bottom-8 text-center text-red-400 text-sm"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          WARNING: Security breach imminent. Hurry!
        </motion.div>
      )}
    </div>
  );
}
