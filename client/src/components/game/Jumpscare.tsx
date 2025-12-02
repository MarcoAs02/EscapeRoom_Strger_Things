import { useEscapeGame } from "@/lib/stores/useEscapeGame";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Jumpscare() {
  const { setPhase } = useEscapeGame();
  const [showImage, setShowImage] = useState(true);

  useEffect(() => {
    const screamAudio = new Audio('/sounds/hit.mp3');
    screamAudio.volume = 0.8;
    screamAudio.play().catch(() => {});

    const timeout = setTimeout(() => {
      setShowImage(false);
      setTimeout(() => {
        setPhase("retry");
      }, 500);
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [setPhase]);

  return (
    <AnimatePresence>
      {showImage && (
        <motion.div
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ 
            opacity: 1, 
            scale: [1.5, 1, 1.1, 1],
            x: [0, -10, 10, -10, 10, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
        >
          <motion.img
            src="/sprites/demogorgon_jumpscare_horror_image.png"
            alt="Demogorgon"
            className="w-full h-full object-cover"
            animate={{
              scale: [1, 1.05, 1, 1.05, 1],
              filter: [
                "brightness(1) contrast(1)",
                "brightness(1.2) contrast(1.2)",
                "brightness(0.8) contrast(1.3)",
                "brightness(1.1) contrast(1.1)",
                "brightness(1) contrast(1)",
              ],
            }}
            transition={{
              duration: 0.5,
              repeat: 3,
            }}
          />
          
          <div className="absolute inset-0 bg-red-900/30 animate-pulse" />
          
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(circle, transparent 0%, black 100%)",
                "radial-gradient(circle, transparent 30%, black 100%)",
                "radial-gradient(circle, transparent 0%, black 100%)",
              ],
            }}
            transition={{ duration: 0.2, repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
