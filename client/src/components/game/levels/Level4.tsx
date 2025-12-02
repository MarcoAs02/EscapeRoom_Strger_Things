import { useState, useEffect, useCallback, useRef } from "react";
import { useEscapeGame } from "@/lib/stores/useEscapeGame";
import { motion } from "framer-motion";

const GRID_SIZE = 15;
const CELL_SIZE = 32;

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  pos: Position;
  direction: Position;
  color: string;
}

const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,1,0,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,1,1,0,1,0,0,0,0,0,1,0,1,1,1],
  [1,0,0,0,1,0,1,1,1,0,1,0,0,0,1],
  [1,1,1,0,1,0,0,0,0,0,1,0,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,0,1,1,0,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export function Level4() {
  const { completeLevel, triggerJumpscare, addScore, phase } = useEscapeGame();
  const [playerPos, setPlayerPos] = useState<Position>({ x: 7, y: 7 });
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [dots, setDots] = useState<boolean[][]>([]);
  const [dotsCollected, setDotsCollected] = useState(0);
  const [totalDots, setTotalDots] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [message, setMessage] = useState("Collect all the dots! Use WASD or Arrow keys to move Steve!");
  const keysPressed = useRef<Set<string>>(new Set());
  const isGameActive = useRef(true);

  const initializeGame = useCallback(() => {
    const newDots: boolean[][] = [];
    let dotCount = 0;
    
    for (let y = 0; y < GRID_SIZE; y++) {
      newDots[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        if (MAZE[y][x] === 0) {
          newDots[y][x] = true;
          dotCount++;
        } else {
          newDots[y][x] = false;
        }
      }
    }
    
    newDots[7][7] = false;
    dotCount--;
    
    setDots(newDots);
    setTotalDots(dotCount);
    setDotsCollected(0);
    
    const ghostColors = ['#ff0000', '#00ffff', '#ff69b4', '#ffa500'];
    const newGhosts: Ghost[] = [
      { pos: { x: 1, y: 1 }, direction: { x: 1, y: 0 }, color: ghostColors[0] },
      { pos: { x: 13, y: 1 }, direction: { x: -1, y: 0 }, color: ghostColors[1] },
      { pos: { x: 1, y: 13 }, direction: { x: 0, y: -1 }, color: ghostColors[2] },
      { pos: { x: 13, y: 13 }, direction: { x: 0, y: 1 }, color: ghostColors[3] },
    ];
    setGhosts(newGhosts);
    setPlayerPos({ x: 7, y: 7 });
    isGameActive.current = true;
  }, []);

  useEffect(() => {
    initializeGame();
    return () => {
      isGameActive.current = false;
    };
  }, [initializeGame]);

  useEffect(() => {
    if (phase !== "playing") {
      isGameActive.current = false;
    }
  }, [phase]);

  const canMove = useCallback((x: number, y: number) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    return MAZE[y][x] === 0;
  }, []);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!isGameActive.current || gameWon) return;
    
    setPlayerPos(prev => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;
      
      if (canMove(newX, newY)) {
        return { x: newX, y: newY };
      }
      return prev;
    });
  }, [canMove, gameWon]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (phase !== "playing" || gameWon) return;
    
    const gameLoop = () => {
      if (!isGameActive.current || gameWon) return;
      
      const keys = keysPressed.current;
      
      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) {
        movePlayer(0, -1);
      }
      if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) {
        movePlayer(0, 1);
      }
      if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
        movePlayer(-1, 0);
      }
      if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
        movePlayer(1, 0);
      }
    };

    const interval = setInterval(gameLoop, 150);
    return () => clearInterval(interval);
  }, [movePlayer, phase, gameWon]);

  useEffect(() => {
    if (!isGameActive.current || gameWon) return;
    
    setDots(prev => {
      if (!prev[playerPos.y] || prev[playerPos.y][playerPos.x] === undefined) return prev;
      
      if (prev[playerPos.y][playerPos.x]) {
        const newDots = prev.map(row => [...row]);
        newDots[playerPos.y][playerPos.x] = false;
        setDotsCollected(c => c + 1);
        addScore(10);
        
        const hitSound = new Audio('/sounds/hit.mp3');
        hitSound.volume = 0.1;
        hitSound.play().catch(() => {});
        
        return newDots;
      }
      return prev;
    });
  }, [playerPos, addScore, gameWon]);

  useEffect(() => {
    if (dotsCollected > 0 && dotsCollected >= totalDots && !gameWon) {
      setGameWon(true);
      isGameActive.current = false;
      setMessage("All dots collected! Steve escapes the arcade!");
      
      const successSound = new Audio('/sounds/success.mp3');
      successSound.volume = 0.5;
      successSound.play().catch(() => {});
      
      setTimeout(() => {
        completeLevel();
      }, 1500);
    }
  }, [dotsCollected, totalDots, completeLevel, gameWon]);

  useEffect(() => {
    if (phase !== "playing" || gameWon) return;
    
    const moveGhosts = () => {
      if (!isGameActive.current || gameWon) return;
      
      setGhosts(prev => prev.map(ghost => {
        const directions = [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 },
        ];
        
        const validDirs = directions.filter(dir => 
          canMove(ghost.pos.x + dir.x, ghost.pos.y + dir.y)
        );
        
        if (validDirs.length === 0) return ghost;
        
        let bestDir = validDirs[0];
        let bestDist = Infinity;
        
        for (const dir of validDirs) {
          const newX = ghost.pos.x + dir.x;
          const newY = ghost.pos.y + dir.y;
          const dist = Math.abs(newX - playerPos.x) + Math.abs(newY - playerPos.y);
          
          if (dist < bestDist) {
            bestDist = dist;
            bestDir = dir;
          }
        }
        
        if (Math.random() > 0.7) {
          bestDir = validDirs[Math.floor(Math.random() * validDirs.length)];
        }
        
        return {
          ...ghost,
          pos: { 
            x: ghost.pos.x + bestDir.x, 
            y: ghost.pos.y + bestDir.y 
          },
          direction: bestDir,
        };
      }));
    };

    const interval = setInterval(moveGhosts, 400);
    return () => clearInterval(interval);
  }, [canMove, playerPos, phase, gameWon]);

  useEffect(() => {
    if (!isGameActive.current || gameWon || phase !== "playing") return;
    
    for (const ghost of ghosts) {
      if (ghost.pos.x === playerPos.x && ghost.pos.y === playerPos.y) {
        isGameActive.current = false;
        triggerJumpscare();
        return;
      }
    }
  }, [ghosts, playerPos, triggerJumpscare, gameWon, phase]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ background: "#000" }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 text-center mb-4"
      >
        <h2 
          className="text-2xl font-bold text-yellow-400 mb-1"
          style={{ fontFamily: "'Courier New', monospace", textShadow: "0 0 10px #ffff00" }}
        >
          THE ARCADE - PAC-STEVE
        </h2>
        <p className="text-yellow-200 text-sm" style={{ fontFamily: "'Courier New', monospace" }}>
          {message}
        </p>
      </motion.div>

      <div 
        className="relative border-4 border-blue-600"
        style={{ 
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          background: '#000',
        }}
      >
        {MAZE.map((row, y) => row.map((cell, x) => (
          cell === 1 && (
            <div
              key={`wall-${x}-${y}`}
              className="absolute bg-blue-800 border border-blue-600"
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            />
          )
        )))}

        {dots.map((row, y) => row.map((hasDot, x) => (
          hasDot && (
            <div
              key={`dot-${x}-${y}`}
              className="absolute bg-yellow-400 rounded-full"
              style={{
                left: x * CELL_SIZE + CELL_SIZE / 2 - 3,
                top: y * CELL_SIZE + CELL_SIZE / 2 - 3,
                width: 6,
                height: 6,
              }}
            />
          )
        )))}

        <motion.div
          className="absolute rounded-full overflow-hidden border-2 border-yellow-400"
          style={{
            left: playerPos.x * CELL_SIZE + 2,
            top: playerPos.y * CELL_SIZE + 2,
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          <img 
            src="/sprites/steve_harrington_pixel_art_sprite.png" 
            alt="Steve"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {ghosts.map((ghost, index) => (
          <motion.div
            key={`ghost-${index}`}
            className="absolute rounded-full overflow-hidden border-2"
            style={{
              left: ghost.pos.x * CELL_SIZE + 2,
              top: ghost.pos.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
              borderColor: ghost.color,
              boxShadow: `0 0 10px ${ghost.color}`,
            }}
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: index * 0.1 }}
          >
            <img 
              src="/sprites/demogorgon_pixel_art_sprite.png" 
              alt="Demogorgon"
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 mt-4 text-center">
        <p className="text-yellow-400 text-lg" style={{ fontFamily: "'Courier New', monospace" }}>
          DOTS: {dotsCollected}/{totalDots}
        </p>
        <p className="text-gray-500 text-xs mt-2" style={{ fontFamily: "'Courier New', monospace" }}>
          Use WASD or Arrow keys to move
        </p>
      </div>
    </div>
  );
}
