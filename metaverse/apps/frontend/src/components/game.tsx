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
  private lastSentGridX: number = -999;
  private lastSentGridY: number = -999;

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
    if (!this.textures.exists('carpet')) {
      this.load.image("carpet", "/assets/carpet.jpg");
    }
    this.load.once('complete', () => {
      this.assetsLoaded = true;
    });
  }

  private sendToServer(x: number, y: number) {
    if (!this.gameWs) {
      console.error("[GameScene] No WebSocket available to send move");
      return;
    }

    console.log(`[GameScene] Sending move: grid=(${x}, ${y}), userID=${this.userID}`);
    this.gameWs.send(JSON.stringify({
      type: "move",
      payload: { x, y, userID: this.userID },
    }));
  }

  public updateLocation(userID: string, x: number, y: number) {
    const sprite = this.playerSprites.get(userID);
    if (sprite) {
      console.log(`[GameScene] Moving sprite for ${userID} to grid=(${x}, ${y}), pixel=(${x * 50 + 25}, ${y * 50 + 25})`);
      const targetX = x * 50 + 25;
      const targetY = y * 50 + 25;
      sprite.setPosition(targetX, targetY);
    } else {
      console.warn(`[GameScene] Sprite not found for userID: ${userID}. Available sprites:`, Array.from(this.playerSprites.keys()));
    }
  }

  public syncPlayers(players: { userID: string; avatarID: string; x: number; y: number }[]) {
    // 1. Remove players who left
    for (const [userID, sprite] of this.playerSprites) {
      if (!players.find(p => p.userID === userID)) {
        sprite.destroy();
        this.playerSprites.delete(userID);
      }
    }

    // 2. Add new players
    players.forEach(player => {
      if (player.userID !== this.userID && !this.playerSprites.has(player.userID)) {
        const sprite = this.add.sprite(player.x * 50 + 25, player.y * 50 + 25, "player").setScale(0.5).setDepth(1);
        this.playerSprites.set(player.userID, sprite);
      }
    });

    // Note: We DO NOT update positions of existing players here.
    // Movement is handled exclusively by WebSocket 'move' events to prevent React-induced ease-in/snap glitches.
    // However, if we wanted to force-correct huge desyncs, we could do it here, but keeping it decoupled is better for smoothness.
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
        // if((row+col)%2)
        // this.add.image(x, y, "square").setScale(0.25);
        // else
        this.add.image(x, y, "carpet").setScale(0.01);
      }
    }
    if (this.gameWs) {
      console.log("[GameScene] Setting up WebSocket message handler. WebSocket state:", this.gameWs.readyState);
      const handleMessage = (message: MessageEvent) => {
        console.log("[GameScene] *** HANDLER CALLED ***", message);
        const data = JSON.parse(message.data);

        console.log(`[GameScene] Received WebSocket message:`, data.type, data.payload);

        if (data.type === "move") {
          console.log(`[GameScene] Processing move event for userID=${data.payload.userID}`);
          this.updateLocation(data.payload.userID, data.payload.x, data.payload.y);
        }
        else if (data.type === "movement-rejected") {
          console.warn("[GameScene] Movement was rejected by server:", data.payload);
        }
        else if (data.type === "space-joined") {
          console.log("[GameScene] Space joined event");
        }
        else if (data.type === "user-joined") {
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

      this.gameWs.addEventListener('message', handleMessage);

      // Clean up event listener when scene is destroyed
      this.events.on('destroy', () => {
        this.gameWs?.removeEventListener('message', handleMessage);
      });
    } else {
      console.error("[GameScene] No WebSocket available in create() - cannot set up message handler!");
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

    // Initialize last sent grid position to spawn
    this.lastSentGridX = ogPlayer.x;
    this.lastSentGridY = ogPlayer.y;

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

    // Calculate current grid position
    const currentGridX = Math.floor(this.player.x / 50);
    const currentGridY = Math.floor(this.player.y / 50);

    // Only send to server if grid position has changed
    const shouldSendUpdate = (currentGridX !== this.lastSentGridX || currentGridY !== this.lastSentGridY);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.anims.play('left', true);
      if (shouldSendUpdate) {
        this.sendToServer(currentGridX, currentGridY);
        this.lastSentGridX = currentGridX;
        this.lastSentGridY = currentGridY;
      }
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.anims.play('right', true);
      if (shouldSendUpdate) {
        this.sendToServer(currentGridX, currentGridY);
        this.lastSentGridX = currentGridX;
        this.lastSentGridY = currentGridY;
      }
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      if (shouldSendUpdate) {
        this.sendToServer(currentGridX, currentGridY);
        this.lastSentGridX = currentGridX;
        this.lastSentGridY = currentGridY;
      }
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
      if (shouldSendUpdate) {
        this.sendToServer(currentGridX, currentGridY);
        this.lastSentGridX = currentGridX;
        this.lastSentGridY = currentGridY;
      }
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

  // Sync players list (Add/Remove) without interfering with movement
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.syncPlayers(players);
  }, [players]);

  return <div ref={gameContainer} style={{ width: "100%", height: "100%" }} />;
};

export default Game;