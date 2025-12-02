import { useState, useEffect, useCallback, useRef } from "react";
import { useEscapeGame } from "@/lib/stores/useEscapeGame";
import { motion, AnimatePresence } from "framer-motion";

const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;
const PLAYER_SIZE = 50;
const ENEMY_SIZE = 40;
const BOSS_SIZE = 80;
const BULLET_SIZE = 8;
const ENEMY_ROWS = 3;
const ENEMIES_PER_ROW = 6;

interface Position {
  x: number;
  y: number;
}

interface Enemy {
  id: number;
  pos: Position;
  alive: boolean;
}

interface Bullet {
  id: number;
  pos: Position;
  isEnemy: boolean;
}

interface Boss {
  pos: Position;
  health: number;
  maxHealth: number;
  alive: boolean;
}

export function Level5() {
  const { completeLevel, triggerJumpscare, addScore, phase, enemySpeedMultiplier } = useEscapeGame();
  const [playerPos, setPlayerPos] = useState({ x: GAME_WIDTH / 2 - PLAYER_SIZE / 2, y: GAME_HEIGHT - PLAYER_SIZE - 20 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [boss, setBoss] = useState<Boss | null>(null);
  const [enemyDirection, setEnemyDirection] = useState(1);
  const [gamePhase, setGamePhase] = useState<'enemies' | 'boss'>('enemies');
  const [message, setMessage] = useState("Destroy the Demogorgons! Use A/D or arrows to move, SPACE to shoot!");
  const [gameWon, setGameWon] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastShot = useRef(0);
  const bulletIdRef = useRef(0);
  const isGameActive = useRef(true);

  const initializeEnemies = useCallback(() => {
    const newEnemies: Enemy[] = [];
    let id = 0;
    
    for (let row = 0; row < ENEMY_ROWS; row++) {
      for (let col = 0; col < ENEMIES_PER_ROW; col++) {
        newEnemies.push({
          id: id++,
          pos: {
            x: 80 + col * (ENEMY_SIZE + 30),
            y: 50 + row * (ENEMY_SIZE + 20),
          },
          alive: true,
        });
      }
    }
    
    setEnemies(newEnemies);
    isGameActive.current = true;
  }, []);

  useEffect(() => {
    initializeEnemies();
    return () => {
      isGameActive.current = false;
    };
  }, [initializeEnemies]);

  useEffect(() => {
    if (phase !== "playing") {
      isGameActive.current = false;
    }
  }, [phase]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if (e.key === ' ') e.preventDefault();
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
      const speed = 8;
      
      setPlayerPos(prev => {
        let newX = prev.x;
        
        if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
          newX = Math.max(0, prev.x - speed);
        }
        if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
          newX = Math.min(GAME_WIDTH - PLAYER_SIZE, prev.x + speed);
        }
        
        return { ...prev, x: newX };
      });

      if (keys.has(' ') && Date.now() - lastShot.current > 300) {
        lastShot.current = Date.now();
        setPlayerPos(prev => {
          setBullets(bullets => [...bullets, {
            id: bulletIdRef.current++,
            pos: { x: prev.x + PLAYER_SIZE / 2 - BULLET_SIZE / 2, y: prev.y - 10 },
            isEnemy: false,
          }]);
          return prev;
        });
        
        const hitSound = new Audio('/sounds/hit.mp3');
        hitSound.volume = 0.1;
        hitSound.play().catch(() => {});
      }
    };

    const interval = setInterval(gameLoop, 30);
    return () => clearInterval(interval);
  }, [phase, gameWon]);

  useEffect(() => {
    if (phase !== "playing" || gameWon) return;
    
    const moveBullets = () => {
      if (!isGameActive.current) return;
      
      setBullets(prev => {
        return prev
          .map(bullet => ({
            ...bullet,
            pos: { ...bullet.pos, y: bullet.pos.y + (bullet.isEnemy ? 5 : -8) },
          }))
          .filter(bullet => bullet.pos.y > -20 && bullet.pos.y < GAME_HEIGHT + 20);
      });
    };

    const interval = setInterval(moveBullets, 30);
    return () => clearInterval(interval);
  }, [phase, gameWon]);

  useEffect(() => {
    if (gamePhase !== 'enemies' || phase !== "playing" || gameWon) return;
    
    const moveEnemies = () => {
      if (!isGameActive.current) return;
      
      setEnemies(prev => {
        const aliveEnemies = prev.filter(e => e.alive);
        if (aliveEnemies.length === 0) return prev;

        const leftMost = Math.min(...aliveEnemies.map(e => e.pos.x));
        const rightMost = Math.max(...aliveEnemies.map(e => e.pos.x));
        
        let newDirection = enemyDirection;
        let moveDown = false;
        
        if (rightMost + ENEMY_SIZE >= GAME_WIDTH - 10 && enemyDirection > 0) {
          newDirection = -1;
          moveDown = true;
        } else if (leftMost <= 10 && enemyDirection < 0) {
          newDirection = 1;
          moveDown = true;
        }
        
        if (newDirection !== enemyDirection) {
          setEnemyDirection(newDirection);
        }
        
        return prev.map(enemy => ({
          ...enemy,
          pos: {
            x: enemy.pos.x + newDirection * 10,
            y: enemy.pos.y + (moveDown ? 15 : 0),
          },
        }));
      });
    };

    const enemyMoveSpeed = Math.max(200, Math.floor(500 / enemySpeedMultiplier));
    const interval = setInterval(moveEnemies, enemyMoveSpeed);
    return () => clearInterval(interval);
  }, [gamePhase, phase, enemyDirection, gameWon, enemySpeedMultiplier]);

  useEffect(() => {
    if (gamePhase !== 'enemies' || phase !== "playing" || gameWon) return;
    
    const enemyShoot = () => {
      if (!isGameActive.current) return;
      
      const aliveEnemies = enemies.filter(e => e.alive);
      if (aliveEnemies.length === 0) return;
      
      if (Math.random() > 0.5) {
        const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        setBullets(prev => [...prev, {
          id: bulletIdRef.current++,
          pos: { x: shooter.pos.x + ENEMY_SIZE / 2 - BULLET_SIZE / 2, y: shooter.pos.y + ENEMY_SIZE },
          isEnemy: true,
        }]);
      }
    };

    const shootSpeed = Math.max(500, Math.floor(1000 / enemySpeedMultiplier));
    const interval = setInterval(enemyShoot, shootSpeed);
    return () => clearInterval(interval);
  }, [gamePhase, phase, enemies, gameWon, enemySpeedMultiplier]);

  useEffect(() => {
    if (phase !== "playing" || gameWon) return;
    
    setBullets(prev => {
      let bulletsToRemove: number[] = [];
      let enemiesHit: number[] = [];
      let bossHit = false;
      let playerHit = false;
      
      prev.forEach(bullet => {
        if (!bullet.isEnemy) {
          if (gamePhase === 'enemies') {
            enemies.forEach(enemy => {
              if (enemy.alive &&
                  bullet.pos.x < enemy.pos.x + ENEMY_SIZE &&
                  bullet.pos.x + BULLET_SIZE > enemy.pos.x &&
                  bullet.pos.y < enemy.pos.y + ENEMY_SIZE &&
                  bullet.pos.y + BULLET_SIZE > enemy.pos.y) {
                enemiesHit.push(enemy.id);
                bulletsToRemove.push(bullet.id);
              }
            });
          } else if (boss && boss.alive) {
            if (bullet.pos.x < boss.pos.x + BOSS_SIZE &&
                bullet.pos.x + BULLET_SIZE > boss.pos.x &&
                bullet.pos.y < boss.pos.y + BOSS_SIZE &&
                bullet.pos.y + BULLET_SIZE > boss.pos.y) {
              bossHit = true;
              bulletsToRemove.push(bullet.id);
            }
          }
        } else {
          if (bullet.pos.x < playerPos.x + PLAYER_SIZE &&
              bullet.pos.x + BULLET_SIZE > playerPos.x &&
              bullet.pos.y < playerPos.y + PLAYER_SIZE &&
              bullet.pos.y + BULLET_SIZE > playerPos.y) {
            playerHit = true;
          }
        }
      });
      
      if (enemiesHit.length > 0) {
        setEnemies(e => e.map(enemy => 
          enemiesHit.includes(enemy.id) ? { ...enemy, alive: false } : enemy
        ));
        addScore(50 * enemiesHit.length);
      }
      
      if (bossHit && boss) {
        setBoss(prev => prev ? { ...prev, health: prev.health - 1 } : null);
        addScore(20);
      }
      
      if (playerHit && isGameActive.current) {
        isGameActive.current = false;
        triggerJumpscare();
      }
      
      return prev.filter(b => !bulletsToRemove.includes(b.id));
    });
  }, [bullets, enemies, boss, gamePhase, playerPos, addScore, triggerJumpscare, phase, gameWon]);

  useEffect(() => {
    const aliveEnemies = enemies.filter(e => e.alive);
    if (gamePhase === 'enemies' && enemies.length > 0 && aliveEnemies.length === 0 && !gameWon) {
      setMessage("The Demogorgons are defeated! But wait... VECNA APPEARS!");
      setGamePhase('boss');
      setBullets([]);
      setBoss({
        pos: { x: GAME_WIDTH / 2 - BOSS_SIZE / 2, y: 50 },
        health: 20,
        maxHealth: 20,
        alive: true,
      });
    }
  }, [enemies, gamePhase, gameWon]);

  useEffect(() => {
    if (gamePhase !== 'boss' || !boss || phase !== "playing" || gameWon) return;
    
    const moveBoss = () => {
      if (!isGameActive.current) return;
      
      setBoss(prev => {
        if (!prev || !prev.alive) return prev;
        const newX = prev.pos.x + (Math.random() > 0.5 ? 20 : -20);
        return {
          ...prev,
          pos: { ...prev.pos, x: Math.max(0, Math.min(GAME_WIDTH - BOSS_SIZE, newX)) },
        };
      });
    };

    const bossShoot = () => {
      if (!isGameActive.current || !boss || !boss.alive) return;
      
      setBoss(currentBoss => {
        if (!currentBoss || !currentBoss.alive) return currentBoss;
        
        for (let i = -1; i <= 1; i++) {
          setBullets(prev => [...prev, {
            id: bulletIdRef.current++,
            pos: { x: currentBoss.pos.x + BOSS_SIZE / 2 - BULLET_SIZE / 2 + i * 30, y: currentBoss.pos.y + BOSS_SIZE },
            isEnemy: true,
          }]);
        }
        return currentBoss;
      });
    };

    const bossMoveSpeed = Math.max(400, Math.floor(800 / enemySpeedMultiplier));
    const bossShootSpeed = Math.max(700, Math.floor(1500 / enemySpeedMultiplier));
    
    const moveInterval = setInterval(moveBoss, bossMoveSpeed);
    const shootInterval = setInterval(bossShoot, bossShootSpeed);
    
    return () => {
      clearInterval(moveInterval);
      clearInterval(shootInterval);
    };
  }, [gamePhase, boss, phase, gameWon, enemySpeedMultiplier]);

  useEffect(() => {
    if (boss && boss.health <= 0 && !gameWon) {
      setGameWon(true);
      isGameActive.current = false;
      setBoss(prev => prev ? { ...prev, alive: false } : null);
      setMessage("VECNA IS DEFEATED! You've saved Hawkins!");
      addScore(500);
      
      const successSound = new Audio('/sounds/success.mp3');
      successSound.volume = 0.5;
      successSound.play().catch(() => {});
      
      setTimeout(() => {
        completeLevel();
      }, 2000);
    }
  }, [boss, addScore, completeLevel, gameWon]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ background: "linear-gradient(to bottom, #0a0020, #1a0030)" }}>
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-50"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 text-center mb-4"
      >
        <h2 
          className="text-2xl font-bold text-purple-400 mb-1"
          style={{ fontFamily: "'Courier New', monospace", textShadow: "0 0 10px #9333ea" }}
        >
          VECNA'S LAIR - SPACE INVADERS
        </h2>
        <p className="text-purple-200 text-sm" style={{ fontFamily: "'Courier New', monospace" }}>
          {message}
        </p>
      </motion.div>

      <div 
        className="relative border-4 border-purple-600 overflow-hidden"
        style={{ 
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          background: 'rgba(0,0,0,0.8)',
        }}
      >
        {gamePhase === 'enemies' && enemies.map(enemy => (
          enemy.alive && (
            <motion.div
              key={enemy.id}
              className="absolute overflow-hidden rounded"
              style={{
                left: enemy.pos.x,
                top: enemy.pos.y,
                width: ENEMY_SIZE,
                height: ENEMY_SIZE,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <img 
                src="/sprites/demogorgon_pixel_art_sprite.png" 
                alt="Demogorgon"
                className="w-full h-full object-cover"
              />
            </motion.div>
          )
        ))}

        <AnimatePresence>
          {boss && boss.alive && (
            <motion.div
              className="absolute overflow-hidden rounded"
              style={{
                left: boss.pos.x,
                top: boss.pos.y,
                width: BOSS_SIZE,
                height: BOSS_SIZE,
              }}
              initial={{ opacity: 0, scale: 2, y: -100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
            >
              <img 
                src="/sprites/vecna_villain_pixel_art_sprite.png" 
                alt="Vecna"
                className="w-full h-full object-cover"
              />
              <div className="absolute -bottom-4 left-0 right-0 h-2 bg-gray-800">
                <div 
                  className="h-full bg-red-600 transition-all"
                  style={{ width: `${(boss.health / boss.maxHealth) * 100}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="absolute overflow-hidden rounded"
          style={{
            left: playerPos.x,
            top: playerPos.y,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
          }}
        >
          <img 
            src="/sprites/eleven_pixel_art_sprite.png" 
            alt="Eleven"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {bullets.map(bullet => (
          <motion.div
            key={bullet.id}
            className={`absolute rounded-full ${bullet.isEnemy ? 'bg-red-500' : 'bg-purple-400'}`}
            style={{
              left: bullet.pos.x,
              top: bullet.pos.y,
              width: BULLET_SIZE,
              height: bullet.isEnemy ? BULLET_SIZE * 2 : BULLET_SIZE * 2,
              boxShadow: bullet.isEnemy ? '0 0 10px #ff0000' : '0 0 10px #a855f7',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mt-4 text-center">
        <p className="text-purple-400 text-sm" style={{ fontFamily: "'Courier New', monospace" }}>
          {gamePhase === 'enemies' 
            ? `ENEMIES: ${enemies.filter(e => !e.alive).length}/${enemies.length}` 
            : boss && `VECNA HEALTH: ${boss.health}/${boss.maxHealth}`
          }
        </p>
        <p className="text-gray-500 text-xs mt-2" style={{ fontFamily: "'Courier New', monospace" }}>
          A/D or Arrows to move • SPACE to shoot
        </p>
      </div>
    </div>
  );
}
