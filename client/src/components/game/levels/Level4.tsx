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

type GhostMode = "scatter" | "chase" | "frightened";

const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,1,1,0,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,1,1,0,1,0,0,0,0,0,1,0,1,1,1],
  // tunnel row: aperture ai bordi per warp
  [0,0,0,0,1,0,1,1,1,0,1,0,0,0,0],
  [1,1,1,0,1,0,0,0,0,0,1,0,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,0,1,1,0,1,0,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export function Level4() {
  const { completeLevel, triggerJumpscare, addScore, phase, enemySpeedMultiplier } = useEscapeGame();
  const [playerPos, setPlayerPos] = useState<Position>({ x: 7, y: 7 });
  const [playerDir, setPlayerDir] = useState<Position>({ x: 0, y: 0 });
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [dots, setDots] = useState<boolean[][]>([]);
  const [powerDots, setPowerDots] = useState<boolean[][]>([]);
  const [dotsCollected, setDotsCollected] = useState(0);
  const [totalDots, setTotalDots] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [message, setMessage] = useState("Collect all the dots! Use WASD or Arrow keys to move Steve!");
  const [frightenedUntil, setFrightenedUntil] = useState(0);
  const [ghostMode, setGhostMode] = useState<GhostMode>("scatter");
  const keysPressed = useRef<Set<string>>(new Set());
  const pendingDirection = useRef<Position>({ x: 0, y: 0 });
  const isGameActive = useRef(true);
  const modeSwitchRef = useRef<NodeJS.Timeout | null>(null);
  const frightenedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const initializeGame = useCallback(() => {
    const newDots: boolean[][] = [];
    const newPowerDots: boolean[][] = [];
    let dotCount = 0;

    for (let y = 0; y < GRID_SIZE; y++) {
      newDots[y] = [];
      newPowerDots[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        if (MAZE[y][x] === 0) {
          newDots[y][x] = true;
          newPowerDots[y][x] = false;
          dotCount++;
        } else {
          newDots[y][x] = false;
          newPowerDots[y][x] = false;
        }
      }
    }

    newDots[7][7] = false;
    dotCount--;
    const powerPositions = [
      { x: 1, y: 7 },
      { x: 13, y: 7 },
      { x: 7, y: 1 },
      { x: 7, y: 13 },
    ];
    powerPositions.forEach(({ x, y }) => {
      if (MAZE[y][x] === 0) {
        newPowerDots[y][x] = true;
        if (newDots[y][x]) {
          newDots[y][x] = false;
          dotCount--;
        }
      }
    });

    setDots(newDots);
    setPowerDots(newPowerDots);
    setTotalDots(dotCount);
    setDotsCollected(0);
    setFrightenedUntil(0);
    setGhostMode("scatter");

    const ghostColors = ['#ff0000', '#00ffff', '#ff69b4', '#ffa500'];
    const newGhosts: Ghost[] = [
      { pos: { x: 1, y: 1 }, direction: { x: 1, y: 0 }, color: ghostColors[0] },
      { pos: { x: 13, y: 1 }, direction: { x: -1, y: 0 }, color: ghostColors[1] },
      { pos: { x: 1, y: 13 }, direction: { x: 0, y: -1 }, color: ghostColors[2] },
      { pos: { x: 13, y: 13 }, direction: { x: 0, y: 1 }, color: ghostColors[3] },
    ];
    setGhosts(newGhosts);
    setPlayerPos({ x: 7, y: 7 });
    setPlayerDir({ x: 0, y: 0 });
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
    if (x < 0) x = GRID_SIZE - 1;
    if (x >= GRID_SIZE) x = 0;
    if (y < 0) y = GRID_SIZE - 1;
    if (y >= GRID_SIZE) y = 0;
    return MAZE[y][x] === 0;
  }, []);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!isGameActive.current || gameWon) return;

    setPlayerPos(prev => {
      let newX = prev.x + dx;
      let newY = prev.y + dy;

      if (canMove(newX, newY)) {
        if (newX < 0) newX = GRID_SIZE - 1;
        if (newX >= GRID_SIZE) newX = 0;
        if (newY < 0) newY = GRID_SIZE - 1;
        if (newY >= GRID_SIZE) newY = 0;
        return { x: newX, y: newY };
      }
      return prev;
    });
  }, [canMove, gameWon]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if (['ArrowUp','w','W'].includes(e.key)) pendingDirection.current = { x: 0, y: -1 };
      if (['ArrowDown','s','S'].includes(e.key)) pendingDirection.current = { x: 0, y: 1 };
      if (['ArrowLeft','a','A'].includes(e.key)) pendingDirection.current = { x: -1, y: 0 };
      if (['ArrowRight','d','D'].includes(e.key)) pendingDirection.current = { x: 1, y: 0 };
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

      const desired = pendingDirection.current;
      let nextDir = playerDir;

      // prova ad applicare la direzione bufferizzata appena possibile
      if (canMove(playerPos.x + desired.x, playerPos.y + desired.y)) {
        nextDir = desired;
      } else if (!canMove(playerPos.x + nextDir.x, playerPos.y + nextDir.y)) {
        // se bloccato, fermati finché non è libera una direzione
        nextDir = { x: 0, y: 0 };
      }

      if (nextDir.x !== playerDir.x || nextDir.y !== playerDir.y) {
        setPlayerDir(nextDir);
      }

      if (nextDir.x !== 0 || nextDir.y !== 0) {
        movePlayer(nextDir.x, nextDir.y);
      }
    };

    const interval = setInterval(gameLoop, 120);
    return () => clearInterval(interval);
  }, [movePlayer, phase, gameWon, playerDir, playerPos, canMove]);

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

    setPowerDots(prev => {
      if (!prev[playerPos.y] || prev[playerPos.y][playerPos.x] === undefined) return prev;
      if (prev[playerPos.y][playerPos.x]) {
        const newPower = prev.map(row => [...row]);
        newPower[playerPos.y][playerPos.x] = false;
        setFrightenedUntil(Date.now() + 7000);
        setGhostMode("frightened");

        // inverti la direzione per dare l'effetto "panico"
        setGhosts(prevGhosts => prevGhosts.map(g => ({
          ...g,
          direction: { x: -g.direction.x, y: -g.direction.y },
        })));

        const powerSound = new Audio('/sounds/success.mp3');
        powerSound.volume = 0.3;
        powerSound.play().catch(() => {});

        if (frightenedTimerRef.current) clearTimeout(frightenedTimerRef.current);
        frightenedTimerRef.current = setTimeout(() => {
          setGhostMode("chase");
        }, 7000);

        return newPower;
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

      setGhosts(prev => prev.map((ghost, idx) => {
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

        // evita inversione immediata per feeling Pac-Man
        const nonOpposite = validDirs.filter(dir => !(dir.x === -ghost.direction.x && dir.y === -ghost.direction.y));
        const candidateDirs = nonOpposite.length ? nonOpposite : validDirs;

        // corner target per modalità scatter
        const scatterTargets = [
          { x: 1, y: 1 },
          { x: GRID_SIZE - 2, y: 1 },
          { x: 1, y: GRID_SIZE - 2 },
          { x: GRID_SIZE - 2, y: GRID_SIZE - 2 },
        ];

        // target ambush (2 celle avanti alla direzione del player)
        const ambushTarget = {
          x: playerPos.x + playerDir.x * 2,
          y: playerPos.y + playerDir.y * 2,
        };

        let bestDir = candidateDirs[0];

        if (ghostMode === "frightened") {
          let farthest = -1;
          for (const dir of candidateDirs) {
            let newX = ghost.pos.x + dir.x;
            let newY = ghost.pos.y + dir.y;
            if (newX < 0) newX = GRID_SIZE - 1;
            if (newX >= GRID_SIZE) newX = 0;
            if (newY < 0) newY = GRID_SIZE - 1;
            if (newY >= GRID_SIZE) newY = 0;
            const dist = Math.abs(newX - playerPos.x) + Math.abs(newY - playerPos.y);
            if (dist > farthest) {
              farthest = dist;
              bestDir = dir;
            }
          }
        } else {
          const target =
            ghostMode === "scatter"
              ? scatterTargets[idx % scatterTargets.length]
              : idx % 2 === 0
                ? playerPos
                : { x: Math.max(0, Math.min(GRID_SIZE - 1, ambushTarget.x)), y: Math.max(0, Math.min(GRID_SIZE - 1, ambushTarget.y)) };

          let bestScore = Infinity;
          for (const dir of candidateDirs) {
            let newX = ghost.pos.x + dir.x;
            let newY = ghost.pos.y + dir.y;
            if (newX < 0) newX = GRID_SIZE - 1;
            if (newX >= GRID_SIZE) newX = 0;
            if (newY < 0) newY = GRID_SIZE - 1;
            if (newY >= GRID_SIZE) newY = 0;
            const dist = Math.abs(newX - target.x) + Math.abs(newY - target.y);
            if (dist < bestScore) {
              bestScore = dist;
              bestDir = dir;
            }
          }

          // leggera randomizzazione per non essere perfetti
          if (Math.random() > 0.7) {
            bestDir = candidateDirs[Math.floor(Math.random() * candidateDirs.length)];
          }
        }

        let newX = ghost.pos.x + bestDir.x;
        let newY = ghost.pos.y + bestDir.y;
        if (newX < 0) newX = GRID_SIZE - 1;
        if (newX >= GRID_SIZE) newX = 0;
        if (newY < 0) newY = GRID_SIZE - 1;
        if (newY >= GRID_SIZE) newY = 0;

        return {
          ...ghost,
          pos: { 
            x: newX, 
            y: newY 
          },
          direction: bestDir,
        };
      }));
    };

    const baseSpeed = Math.max(130, Math.floor(360 / enemySpeedMultiplier));
    const ghostSpeed = ghostMode === "frightened" ? baseSpeed + 130 : baseSpeed;
    const interval = setInterval(moveGhosts, ghostSpeed);
    return () => clearInterval(interval);
  }, [canMove, playerPos, phase, gameWon, enemySpeedMultiplier, ghostMode]);

  useEffect(() => {
    if (!isGameActive.current || gameWon || phase !== "playing") return;

    for (const ghost of ghosts) {
      if (ghost.pos.x === playerPos.x && ghost.pos.y === playerPos.y) {
        if (ghostMode === "frightened") {
          setGhosts(prev => prev.map((g, idx) => g === ghost ? {
            ...g,
            pos: idx === 0 ? { x: 1, y: 1 } :
                 idx === 1 ? { x: 13, y: 1 } :
                 idx === 2 ? { x: 1, y: 13 } : { x: 13, y: 13 },
          } : g));
          addScore(100);
        } else {
          isGameActive.current = false;
          triggerJumpscare();
        }
        return;
      }
    }
  }, [ghosts, playerPos, triggerJumpscare, gameWon, phase, ghostMode, addScore]);

  useEffect(() => {
    if (phase !== "playing" || gameWon) return;
    const switchMode = () => {
      if (ghostMode !== "frightened") {
        setGhostMode(prev => prev === "scatter" ? "chase" : "scatter");
      }
    };
    modeSwitchRef.current = setInterval(switchMode, 9000);
    return () => {
      if (modeSwitchRef.current) clearInterval(modeSwitchRef.current);
    };
  }, [phase, gameWon, ghostMode]);

  useEffect(() => {
    return () => {
      if (frightenedTimerRef.current) clearTimeout(frightenedTimerRef.current);
    };
  }, []);

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

        {powerDots.map((row, y) => row.map((hasDot, x) => (
          hasDot && (
            <div
              key={`powerdot-${x}-${y}`}
              className="absolute bg-orange-400 rounded-full"
              style={{
                left: x * CELL_SIZE + CELL_SIZE / 2 - 8,
                top: y * CELL_SIZE + CELL_SIZE / 2 - 8,
                width: 16,
                height: 16,
                boxShadow: "0 0 10px 4px rgba(255,165,0,0.6)",
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
              borderColor: ghostMode === "frightened" ? "#00f" : ghost.color,
              boxShadow: `0 0 10px ${ghostMode === "frightened" ? "#00f" : ghost.color}`,
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
        <p className="text-blue-300 text-sm" style={{ fontFamily: "'Courier New', monospace" }}>
          {ghostMode === "frightened" ? `POWER: ${Math.max(0, Math.floor((frightenedUntil - Date.now())/1000))}s` : 'POWER: inactive'}
        </p>
        <p className="text-gray-500 text-xs mt-2" style={{ fontFamily: "'Courier New', monospace" }}>
          Use WASD or Arrow keys to move
        </p>
      </div>
    </div>
  );
}
