import { useEffect, useRef } from "react";
import Phaser from "phaser";
interface GameProps {
    elements: { x: number; y: number; id: string }[];
    dimensions:{width:number,height:number};
  }
  
  const Game: React.FC<GameProps> = ({ elements }) => {
    const gameContainer = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: gameContainer.current || undefined,
        scene: {
          preload,
          create,
        },
      };
  
      const game = new Phaser.Game(config);
  
      return () => {
        game.destroy(true);
      };
    }, [elements]);
  
    const preload = function (this: Phaser.Scene) {
      this.load.image("star", "/assets/star.png");
    };
  
    const create = function (this: Phaser.Scene) {
      elements.forEach((el) => {
        this.add.sprite(el.x, el.y, el.id);
      });
    };
  
    return <div ref={gameContainer} style={{ width: "100%", height: "100%" }} />;
  };
  
  export default Game;
  