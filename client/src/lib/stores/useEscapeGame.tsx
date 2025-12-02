import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "menu" | "playing" | "jumpscare" | "retry" | "victory";
export type LevelType = 1 | 2 | 3 | 4 | 5;
export type Difficulty = "easy" | "medium" | "hard";

interface EscapeGameState {
  phase: GamePhase;
  currentLevel: LevelType;
  timeRemaining: number;
  maxTime: number;
  score: number;
  isTimerRunning: boolean;
  levelCompleted: boolean[];
  difficulty: Difficulty;
  enemySpeedMultiplier: number;
  
  startGame: (difficulty?: Difficulty) => void;
  setLevel: (level: LevelType) => void;
  completeLevel: () => void;
  triggerJumpscare: () => void;
  retry: () => void;
  decrementTime: () => void;
  addScore: (points: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetGame: () => void;
  setPhase: (phase: GamePhase) => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

const BASE_LEVEL_TIMES: Record<LevelType, number> = {
  1: 120,
  2: 150,
  3: 180,
  4: 180,
  5: 240,
};

const DIFFICULTY_SETTINGS: Record<Difficulty, { timeMultiplier: number; enemySpeed: number; scoreMultiplier: number }> = {
  easy: { timeMultiplier: 1.5, enemySpeed: 0.7, scoreMultiplier: 0.5 },
  medium: { timeMultiplier: 1.0, enemySpeed: 1.0, scoreMultiplier: 1.0 },
  hard: { timeMultiplier: 0.7, enemySpeed: 1.5, scoreMultiplier: 2.0 },
};

const getLevelTime = (level: LevelType, difficulty: Difficulty): number => {
  return Math.floor(BASE_LEVEL_TIMES[level] * DIFFICULTY_SETTINGS[difficulty].timeMultiplier);
};

export const useEscapeGame = create<EscapeGameState>()(
  subscribeWithSelector((set, get) => ({
    phase: "menu",
    currentLevel: 1,
    timeRemaining: getLevelTime(1, "medium"),
    maxTime: getLevelTime(1, "medium"),
    score: 0,
    isTimerRunning: false,
    levelCompleted: [false, false, false, false, false],
    difficulty: "medium" as Difficulty,
    enemySpeedMultiplier: 1.0,
    
    startGame: (difficulty: Difficulty = "medium") => {
      const settings = DIFFICULTY_SETTINGS[difficulty];
      set({
        phase: "playing",
        currentLevel: 1,
        timeRemaining: getLevelTime(1, difficulty),
        maxTime: getLevelTime(1, difficulty),
        score: 0,
        isTimerRunning: true,
        levelCompleted: [false, false, false, false, false],
        difficulty,
        enemySpeedMultiplier: settings.enemySpeed,
      });
    },
    
    setLevel: (level: LevelType) => {
      const { difficulty } = get();
      set({
        currentLevel: level,
        timeRemaining: getLevelTime(level, difficulty),
        maxTime: getLevelTime(level, difficulty),
        isTimerRunning: true,
      });
    },
    
    completeLevel: () => {
      const { currentLevel, levelCompleted, score, timeRemaining, difficulty } = get();
      const newCompleted = [...levelCompleted];
      newCompleted[currentLevel - 1] = true;
      
      const scoreMultiplier = DIFFICULTY_SETTINGS[difficulty].scoreMultiplier;
      const timeBonus = Math.floor(timeRemaining * 10 * scoreMultiplier);
      
      if (currentLevel === 5) {
        set({
          phase: "victory",
          levelCompleted: newCompleted,
          isTimerRunning: false,
          score: score + timeBonus + Math.floor(1000 * scoreMultiplier),
        });
      } else {
        const nextLevel = (currentLevel + 1) as LevelType;
        set({
          currentLevel: nextLevel,
          levelCompleted: newCompleted,
          timeRemaining: getLevelTime(nextLevel, difficulty),
          maxTime: getLevelTime(nextLevel, difficulty),
          score: score + timeBonus + Math.floor(500 * scoreMultiplier),
          isTimerRunning: true,
        });
      }
    },
    
    triggerJumpscare: () => {
      set({
        phase: "jumpscare",
        isTimerRunning: false,
      });
    },
    
    retry: () => {
      const { currentLevel, difficulty } = get();
      set({
        phase: "playing",
        timeRemaining: getLevelTime(currentLevel, difficulty),
        maxTime: getLevelTime(currentLevel, difficulty),
        isTimerRunning: true,
      });
    },
    
    decrementTime: () => {
      const { timeRemaining, isTimerRunning } = get();
      if (!isTimerRunning) return;
      
      if (timeRemaining <= 1) {
        get().triggerJumpscare();
      } else {
        set({ timeRemaining: timeRemaining - 1 });
      }
    },
    
    addScore: (points: number) => {
      set((state) => ({ score: state.score + points }));
    },
    
    pauseTimer: () => {
      set({ isTimerRunning: false });
    },
    
    resumeTimer: () => {
      set({ isTimerRunning: true });
    },
    
    resetGame: () => {
      set({
        phase: "menu",
        currentLevel: 1,
        timeRemaining: getLevelTime(1, "medium"),
        maxTime: getLevelTime(1, "medium"),
        score: 0,
        isTimerRunning: false,
        levelCompleted: [false, false, false, false, false],
        difficulty: "medium",
        enemySpeedMultiplier: 1.0,
      });
    },
    
    setPhase: (phase: GamePhase) => {
      set({ phase });
    },
    
    setDifficulty: (difficulty: Difficulty) => {
      const settings = DIFFICULTY_SETTINGS[difficulty];
      set({
        difficulty,
        enemySpeedMultiplier: settings.enemySpeed,
      });
    },
  }))
);

export { DIFFICULTY_SETTINGS };
