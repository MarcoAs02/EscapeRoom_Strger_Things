import { useEffect } from "react";
import { useEscapeGame } from "./lib/stores/useEscapeGame";
import { MainMenu } from "./components/game/MainMenu";
import { GameUI } from "./components/game/GameUI";
import { Jumpscare } from "./components/game/Jumpscare";
import { RetryScreen } from "./components/game/RetryScreen";
import { VictoryScreen } from "./components/game/VictoryScreen";
import { Level1 } from "./components/game/levels/Level1";
import { Level2 } from "./components/game/levels/Level2";
import { Level3 } from "./components/game/levels/Level3";
import { Level4 } from "./components/game/levels/Level4";
import { Level5 } from "./components/game/levels/Level5";
import "@fontsource/inter";
import "./index.css";

function App() {
  const { phase, currentLevel } = useEscapeGame();

  useEffect(() => {
    const bgMusic = new Audio('/sounds/background.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    
    const playMusic = () => {
      bgMusic.play().catch(() => {});
    };
    
    document.addEventListener('click', playMusic, { once: true });
    document.addEventListener('keydown', playMusic, { once: true });
    
    return () => {
      bgMusic.pause();
      document.removeEventListener('click', playMusic);
      document.removeEventListener('keydown', playMusic);
    };
  }, []);

  const renderLevel = () => {
    switch (currentLevel) {
      case 1:
        return <Level1 />;
      case 2:
        return <Level2 />;
      case 3:
        return <Level3 />;
      case 4:
        return <Level4 />;
      case 5:
        return <Level5 />;
      default:
        return <Level1 />;
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      {phase === "menu" && <MainMenu />}
      
      {phase === "playing" && (
        <>
          <GameUI />
          {renderLevel()}
        </>
      )}
      
      {phase === "jumpscare" && <Jumpscare />}
      
      {phase === "retry" && <RetryScreen />}
      
      {phase === "victory" && <VictoryScreen />}
    </div>
  );
}

export default App;
