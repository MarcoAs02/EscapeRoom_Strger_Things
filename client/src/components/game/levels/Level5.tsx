import { useState, useEffect, useCallback, useRef } from "react";
import { useEscapeGame } from "@/lib/stores/useEscapeGame";
import { motion, AnimatePresence } from "framer-motion";

const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;
const PLAYER_SIZE = 50;
const ENEMY_SIZE = 40;
const BOSS_SIZE = 80;
const BULLET_SIZE = 8;
const WAVES = [
  { rows: 2, cols: 6, type: "basic" as const, hp: 1 },
  { rows: 3, cols: 6, type: "sniper" as const, hp: 1 },
  { rows: 3, cols: 6, type: "burst" as const, hp: 1 },
  { rows: 2, cols: 5, type: "bomb" as const, hp: 2 },
];

interface Position {
  x: number;
  y: number;
}

type EnemyType = "basic" | "sniper" | "burst" | "bomb";

interface Enemy {
  id: number;
  pos: Position;
  alive: boolean;
  type: EnemyType;
  hp: number;
}

interface Bullet {
  id: number;
  pos: Position;
  vx: number;
  vy: number;
  isEnemy: boolean;
  kind: "normal" | "burst" | "sniper" | "bomb" | "boss";
  ttl?: number;
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
  const [waveIndex, setWaveIndex] = useState(0);
  const [message, setMessage] = useState("Destroy the Demogorgons! Use A/D or arrows to move, SPACE to shoot!");
  const [gameWon, setGameWon] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastShot = useRef(0);
  const bulletIdRef = useRef(0);
  const isGameActive = useRef(true);

  const initializeEnemies = useCallback(() => {
    const wave = WAVES[waveIndex] || WAVES[0];
    const newEnemies: Enemy[] = [];
    let id = 0;

    const startX = wave.type === "bomb" ? 100 : 80;
    for (let row = 0; row < wave.rows; row++) {
      for (let col = 0; col < wave.cols; col++) {
        newEnemies.push({
          id: id++,
          pos: {
            x: startX + col * (ENEMY_SIZE + 30),
            y: 50 + row * (ENEMY_SIZE + 20),
          },
          alive: true,
          type: wave.type,
          hp: wave.hp,
        });
      }
    }

    setEnemies(newEnemies);
    isGameActive.current = true;
  }, [waveIndex]);

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
            vx: 0,
            vy: -8,
            isEnemy: false,
            kind: "normal",
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
            pos: { ...bullet.pos, x: bullet.pos.x + (bullet.vx ?? 0), y: bullet.pos.y + (bullet.vy ?? (bullet.isEnemy ? 5 : -8)) },
            ttl: bullet.ttl !== undefined ? bullet.ttl - 1 : bullet.ttl,
          }))
          .filter(bullet => {
            const withinY = bullet.pos.y > -40 && bullet.pos.y < GAME_HEIGHT + 40;
            const withinX = bullet.pos.x > -40 && bullet.pos.x < GAME_WIDTH + 40;
            const aliveTtl = bullet.ttl === undefined || bullet.ttl > 0;
            return withinX && withinY && aliveTtl;
          });
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

      const wave = WAVES[waveIndex] || WAVES[0];
      const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      const basePos = { x: shooter.pos.x + ENEMY_SIZE / 2 - BULLET_SIZE / 2, y: shooter.pos.y + ENEMY_SIZE };

      const addBullet = (vx: number, vy: number, kind: Bullet["kind"], extraTtl?: number) => {
        setBullets(prev => [...prev, {
          id: bulletIdRef.current++,
          pos: { ...basePos },
          vx,
          vy,
          isEnemy: true,
          kind,
          ttl: extraTtl,
        }]);
      };

      switch (shooter.type) {
        case "basic":
          if (Math.random() > 0.4) addBullet(0, 5, "normal");
          break;
        case "sniper":
          if (Math.random() > 0.6) addBullet(0, 8, "sniper");
          break;
        case "burst":
          if (Math.random() > 0.55) {
            addBullet(-2, 6, "burst");
            addBullet(0, 7, "burst");
            addBullet(2, 6, "burst");
          }
          break;
        case "bomb":
          if (Math.random() > 0.65) {
            addBullet(0, 3.5, "bomb", 90);
          }
          break;
        default:
          addBullet(0, 5, "normal");
          break;
      }
    };

    const wave = WAVES[waveIndex] || WAVES[0];
    const baseShoot = wave.type === "burst" ? 900 : wave.type === "bomb" ? 1100 : 750;
    const shootSpeed = Math.max(450, Math.floor(baseShoot / enemySpeedMultiplier));
    const interval = setInterval(enemyShoot, shootSpeed);
    return () => clearInterval(interval);
  }, [gamePhase, phase, enemies, gameWon, enemySpeedMultiplier, waveIndex]);

  useEffect(() => {
    if (phase !== "playing" || gameWon) return;

    setBullets(prev => {
      let bulletsToRemove: number[] = [];
      let enemiesHit: number[] = [];
      let bossHit = false;
      let playerHit = false;

      prev.forEach(bullet => {
        const bSize = bullet.kind === "bomb" ? BULLET_SIZE * 2 : BULLET_SIZE;
        const bHeight = bullet.isEnemy ? bSize * 2 : bSize * 2;
        if (!bullet.isEnemy) {
          if (gamePhase === 'enemies') {
            enemies.forEach(enemy => {
              if (enemy.alive &&
                  bullet.pos.x < enemy.pos.x + ENEMY_SIZE &&
                  bullet.pos.x + bSize > enemy.pos.x &&
                  bullet.pos.y < enemy.pos.y + ENEMY_SIZE &&
                  bullet.pos.y + bHeight > enemy.pos.y) {
                enemiesHit.push(enemy.id);
                bulletsToRemove.push(bullet.id);
              }
            });
          } else if (boss && boss.alive) {
            if (bullet.pos.x < boss.pos.x + BOSS_SIZE &&
                bullet.pos.x + bSize > boss.pos.x &&
                bullet.pos.y < boss.pos.y + BOSS_SIZE &&
                bullet.pos.y + bHeight > boss.pos.y) {
              bossHit = true;
              bulletsToRemove.push(bullet.id);
            }
          }
        } else {
          if (bullet.pos.x < playerPos.x + PLAYER_SIZE &&
              bullet.pos.x + bSize > playerPos.x &&
              bullet.pos.y < playerPos.y + PLAYER_SIZE &&
              bullet.pos.y + bHeight > playerPos.y) {
            playerHit = true;
          }
        }
      });

      if (enemiesHit.length > 0) {
        setEnemies(e => e.map(enemy => {
          if (!enemiesHit.includes(enemy.id)) return enemy;
          const newHp = enemy.hp - 1;
          if (newHp <= 0) {
            addScore(50);
            return { ...enemy, alive: false };
          }
          return { ...enemy, hp: newHp };
        }));
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
      if (waveIndex < WAVES.length - 1) {
        setWaveIndex(i => i + 1);
        setMessage(`Wave ${waveIndex + 2}! New enemy pattern incoming...`);
      } else {
        setMessage("The Demogorgons are defeated! But wait... VECNA APPEARS!");
        setGamePhase('boss');
        setBullets([]);
        setBoss({
          pos: { x: GAME_WIDTH / 2 - BOSS_SIZE / 2, y: 50 },
          health: 24,
          maxHealth: 24,
          alive: true,
        });
      }
    }
  }, [enemies, gamePhase, gameWon, waveIndex]);

  useEffect(() => {
    if (gamePhase !== 'boss' || !boss || phase !== "playing" || gameWon) return;

    const moveBoss = () => {
      if (!isGameActive.current) return;

      setBoss(prev => {
        if (!prev || !prev.alive) return prev;
        const newX = prev.pos.x + (Math.random() > 0.5 ? 24 : -24);
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
        const ratio = currentBoss.health / currentBoss.maxHealth;
        const emit = (vx: number, vy: number) => {
          setBullets(prev => [...prev, {
            id: bulletIdRef.current++,
            pos: { x: currentBoss.pos.x + BOSS_SIZE / 2 - BULLET_SIZE / 2, y: currentBoss.pos.y + BOSS_SIZE },
            vx,
            vy,
            isEnemy: true,
            kind: "boss",
          }]);
        };

        if (ratio > 0.7) {
          for (let i = -1; i <= 1; i++) emit(i * 1.5, 6);
        } else if (ratio > 0.35) {
          for (let i = -2; i <= 2; i++) emit(i * 1.8, 6.5);
          emit(-3, 5.5);
          emit(3, 5.5);
        } else {
          for (let i = -3; i <= 3; i++) emit(i * 2, 6.5);
          emit(0, 9);
        }
        return currentBoss;
      });
    };

    const bossMoveSpeed = Math.max(380, Math.floor(760 / enemySpeedMultiplier));
    const bossShootSpeed = Math.max(520, Math.floor(1200 / enemySpeedMultiplier));

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
              width: bullet.kind === "bomb" ? BULLET_SIZE * 2 : BULLET_SIZE,
              height: bullet.kind === "bomb" ? BULLET_SIZE * 2 : BULLET_SIZE * 2,
              boxShadow: bullet.isEnemy ? '0 0 10px #ff0000' : '0 0 10px #a855f7',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mt-4 text-center">
        <p className="text-purple-400 text-sm" style={{ fontFamily: "'Courier New', monospace" }}>
          {gamePhase === 'enemies' 
            ? `WAVE ${waveIndex + 1}/${WAVES.length} - ENEMIES: ${enemies.filter(e => !e.alive).length}/${enemies.length}` 
            : boss && `VECNA HEALTH: ${boss.health}/${boss.maxHealth}`}
        </p>
        <p className="text-gray-500 text-xs mt-2" style={{ fontFamily: "'Courier New', monospace" }}>
          A/D or Arrows to move / SPACE to shoot
        </p>
      </div>
    </div>
  );
}
