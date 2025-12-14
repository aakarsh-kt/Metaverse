import { useEffect, useRef } from "react";
import Phaser from "phaser";

interface GameProps {
  elements: {
    x: number;
    y: number;
    id: string;
    element: { id: string; imageUrl: string }
  }[];
  dimensions: { width: number; height: number };
  ws: WebSocket | undefined;
  players: { userID: string; avatarID: string; x: number; y: number }[];
  userID: string | null;
}

class GameScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private gameElements: GameProps['elements'] = [];
  private gameDimensions: GameProps['dimensions'] = { width: 0, height: 0 };
  private gamePlayers: GameProps['players'] = [];
  private gameWs: WebSocket | undefined;
  private assetsLoaded: boolean = false;
  private userID: string | null = null;
  private playerSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: GameProps) {
    this.gameElements = data.elements;
    this.gameDimensions = data.dimensions;
    this.gameWs = data.ws;
    this.gamePlayers = data.players;
    this.userID = data.userID;
  }

  preload() {
    if (this.assetsLoaded) return;

    this.load.setCORS("anonymous");

    // Load static assets only once
    if (!this.textures.exists('star')) {
      this.load.image("star", "/assets/star.png");
    }
    if (!this.textures.exists('bg')) {
      this.load.image("bg", "/assets/bg.png");
    }
    // if (!this.textures.exists('carpet')) {
    //   this.load.image("carpet", "/assets/carpet.jpg");
    // }
    if (!this.textures.exists('square')) {
      this.load.image("square", "/assets/square.png");
    }
    if (!this.textures.exists('player')) {
      this.load.spritesheet("player", "/assets/image.png", { frameWidth: 32, frameHeight: 48 });
    }

    this.load.once('complete', () => {
      this.assetsLoaded = true;
    });
  }

  private sendToServer(x: number, y: number) {
    if (!this.gameWs) return;

    this.gameWs.send(JSON.stringify({
      type: "move",
      payload: { x, y, userID: this.userID },
    }));
  }

  public updateLocation(userID: string, x: number, y: number) {
    const sprite = this.playerSprites.get(userID);
    if (sprite) {
      sprite.setPosition(x * 50 + 25, y * 50 + 25);
    }
  }

  create() {
    if (!this.gameDimensions) return;

    const gridSize = 50;
    const gridRows = this.gameDimensions.width;
    const gridCols = this.gameDimensions.height;
    const sceneWidth = gridCols * gridSize;
    const sceneHeight = gridRows * gridSize;

    // Set world bounds
    this.physics.world.setBounds(0, 0, sceneWidth, sceneHeight);
    this.cameras.main.setBounds(0, 0, sceneWidth, sceneHeight);

    // Create grid
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const x = col * gridSize + gridSize / 2;
        const y = row * gridSize + gridSize / 2;
        this.add.image(x, y, "square").setScale(0.25);
      }
    }
    if (this.gameWs) {
      this.gameWs.onmessage = (message) => {
        const data = JSON.parse(message.data);

        if (data.type !== 'movement-rejected') {
          console.log(data);
        }

        if (data.type === "move") {
          console.log("Finally moving");
          this.updateLocation(data.payload.userID, data.payload.x, data.payload.y);
        }
        if (data.type === "space-joined") {
          console.log("New player joined");

        }
        if (data.type === "user-joined") {
          console.log("New player joined");
          const newPlayer = data.payload;
          if (newPlayer.userID !== this.userID && !this.playerSprites.has(newPlayer.userID)) {
            const sprite = this.add.sprite(newPlayer.x * 50 + 25, newPlayer.y * 50 + 25, "player").setScale(0.5).setDepth(1);
            this.playerSprites.set(newPlayer.userID, sprite);
          }
        }
        if (data.type === "user-left") {
          console.log("User left");
          const userID = data.payload.userID;
          console.log("Removing player with ID:", userID);
          if (this.playerSprites.has(userID)) {
            console.log("Player found, removing...");
            const sprite = this.playerSprites.get(userID);
            sprite?.destroy();
            this.playerSprites.delete(userID);
          }
        }
      };
    }
    this.load.start();
    // Add elements
    this.gameElements.forEach((element, index) => {
      const uniqueKey = `dynamicImage-${index}`;
      const imageUrl = `http://localhost:3000/api/v1/proxy-image/${element.element.imageUrl}`;

      this.load.image(uniqueKey, imageUrl); // Queue the image for loading
      this.load.once(`filecomplete-image-${uniqueKey}`, () => {
        // Add the image to the scene once it’s loaded
        this.add.image(element.x * 50 + 25, element.y * 50 + 25, uniqueKey).setScale(0.08);
      });
    });
    this.load.start();
    // Add other players
    this.gamePlayers.forEach((player) => {
      console.log("indise player", player)
      if (player.userID !== this.userID) {
        const sprite = this.add.sprite(player.x * 50 + 25, player.y * 50 + 25, "player").setScale(0.5).setDepth(1);
        this.playerSprites.set(player.userID, sprite);
      }
    });
    this.load.start();
    // Add main player
    console.log(this.gamePlayers.length);
    const ogPlayer = this.gamePlayers.find(player => player.userID === this.userID)!;
    this.player = this.physics.add.sprite(ogPlayer.x * 50 + 25, ogPlayer.y * 50 + 25, "player").setDepth(1);
    this.player.setCollideWorldBounds(true);

    // Create animations only if they don't exist
    if (!this.anims.exists('left')) {
      this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.anims.exists('right')) {
      this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.anims.exists('turn')) {
      this.anims.create({
        key: 'turn',
        frames: [{ key: 'player', frame: 4 }],
        frameRate: 20
      });
    }

    // Set up camera and controls
    this.cameras.main.startFollow(this.player);
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  update() {
    if (!this.player || !this.cursors || !this.gameDimensions) return;

    const speed = 200;
    this.player.setVelocity(0);

    const updatePosition = () => {
      const playerX = Math.floor(this.player.x / 50);
      const playerY = Math.floor(this.player.y / 50);
      this.sendToServer(playerX, playerY);
    };

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.anims.play('left', true);
      updatePosition();
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.anims.play('right', true);
      updatePosition();
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      updatePosition();
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
      updatePosition();
    } else {
      this.player.anims.play('turn');
    }
  }
}

const Game: React.FC<GameProps> = ({ elements, dimensions, ws, players, userID }) => {
  const gameContainer = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GameScene | null>(null);

  useEffect(() => {
    if (!gameContainer.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameContainer.current,
      physics: {
        default: "arcade",
        arcade: { debug: false }
      },
      scene: GameScene
    };

    const game = new Phaser.Game(config);

    game.events.once('ready', () => {
      const scene = game.scene.getScene('GameScene') as GameScene;
      if (scene) {
        scene.init({ elements, dimensions, ws, players, userID });
        sceneRef.current = scene;
      }
    });

    return () => {
      game.destroy(true);
      sceneRef.current = null;
    };
  }, [elements, dimensions, ws, userID]);

  // Update other players' positions when players array changes
  useEffect(() => {
    if (!sceneRef.current) return;
    players.forEach(player => {
      if (player.userID !== userID) {
        sceneRef.current!.updateLocation(player.userID, player.x, player.y);
      }
    });
  }, [players, userID]);

  return <div ref={gameContainer} style={{ width: "100%", height: "100%" }} />;
};

export default Game;