import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "menu" | "playing" | "jumpscare" | "retry" | "victory";
export type LevelType = 1 | 2 | 3 | 4 | 5;

interface EscapeGameState {
  phase: GamePhase;
  currentLevel: LevelType;
  timeRemaining: number;
  maxTime: number;
  score: number;
  isTimerRunning: boolean;
  levelCompleted: boolean[];
  
  startGame: () => void;
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
}

const LEVEL_TIMES: Record<LevelType, number> = {
  1: 120,
  2: 150,
  3: 180,
  4: 180,
  5: 240,
};

export const useEscapeGame = create<EscapeGameState>()(
  subscribeWithSelector((set, get) => ({
    phase: "menu",
    currentLevel: 1,
    timeRemaining: LEVEL_TIMES[1],
    maxTime: LEVEL_TIMES[1],
    score: 0,
    isTimerRunning: false,
    levelCompleted: [false, false, false, false, false],
    
    startGame: () => {
      set({
        phase: "playing",
        currentLevel: 1,
        timeRemaining: LEVEL_TIMES[1],
        maxTime: LEVEL_TIMES[1],
        score: 0,
        isTimerRunning: true,
        levelCompleted: [false, false, false, false, false],
      });
    },
    
    setLevel: (level: LevelType) => {
      set({
        currentLevel: level,
        timeRemaining: LEVEL_TIMES[level],
        maxTime: LEVEL_TIMES[level],
        isTimerRunning: true,
      });
    },
    
    completeLevel: () => {
      const { currentLevel, levelCompleted, score, timeRemaining } = get();
      const newCompleted = [...levelCompleted];
      newCompleted[currentLevel - 1] = true;
      
      const timeBonus = Math.floor(timeRemaining * 10);
      
      if (currentLevel === 5) {
        set({
          phase: "victory",
          levelCompleted: newCompleted,
          isTimerRunning: false,
          score: score + timeBonus + 1000,
        });
      } else {
        const nextLevel = (currentLevel + 1) as LevelType;
        set({
          currentLevel: nextLevel,
          levelCompleted: newCompleted,
          timeRemaining: LEVEL_TIMES[nextLevel],
          maxTime: LEVEL_TIMES[nextLevel],
          score: score + timeBonus + 500,
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
      const { currentLevel } = get();
      set({
        phase: "playing",
        timeRemaining: LEVEL_TIMES[currentLevel],
        maxTime: LEVEL_TIMES[currentLevel],
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
        timeRemaining: LEVEL_TIMES[1],
        maxTime: LEVEL_TIMES[1],
        score: 0,
        isTimerRunning: false,
        levelCompleted: [false, false, false, false, false],
      });
    },
    
    setPhase: (phase: GamePhase) => {
      set({ phase });
    },
  }))
);
