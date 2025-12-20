import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

type WebRTCSignal =
  | { kind: "offer"; sdp: RTCSessionDescriptionInit }
  | { kind: "answer"; sdp: RTCSessionDescriptionInit }
  | { kind: "ice"; candidate: RTCIceCandidateInit }
  | { kind: "hangup" };

interface GameProps {
  elements: {
    x: number;
    y: number;
    id: string;
    element: { id: string; imageUrl: string; width: number; height: number; static?: boolean }
  }[];
  dimensions: { width: number; height: number };
  ws: WebSocket | undefined;
  players: { userID: string; username?: string; avatarID: string; avatarUrl?: string; x: number; y: number }[];
  userID: string | null;
}

class GameScene extends Phaser.Scene {
  private proximityAuras: Map<string, Phaser.GameObjects.Arc> = new Map();
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private gameElements: GameProps['elements'] = [];
  private gameDimensions: GameProps['dimensions'] = { width: 0, height: 0 };
  private gamePlayers: GameProps['players'] = [];
  private gameWs: WebSocket | undefined;
  private assetsLoaded: boolean = false;
  private userID: string | null = null;
  private playerSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private playerSpriteKey: Map<string, string> = new Map();
  private loadedPlayerSheets: Set<string> = new Set();
  private failedPlayerSheets: Set<string> = new Set();
  private lastSentGridX: number = -999;
  private lastSentGridY: number = -999;

  private staticColliders?: Phaser.Physics.Arcade.StaticGroup;

  // Proximity Logic
  private proximityRadius = 2; // Blocks

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
    if (!this.textures.exists('star')) this.load.image("star", "/assets/star.png");
    if (!this.textures.exists('bg')) this.load.image("bg", "/assets/bg.png");
    if (!this.textures.exists('square')) this.load.image("square", "/assets/square.png");
    // Fallback sheet if a user's avatar isn't available.
    if (!this.textures.exists('player_default')) this.load.spritesheet("player_default", "/assets/image.png", { frameWidth: 32, frameHeight: 48 });
    // Log any loader failures (missing files, 404s, etc.) so we can see exactly what URL/key failed.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      const key = (file as unknown as { key?: string }).key ?? "";
      const src = (file as unknown as { src?: string; url?: string }).src ?? (file as unknown as { url?: string }).url ?? "";
      console.warn("[Phaser] LOAD_ERROR", { key, src, type: file.type, state: file.state });
      if (typeof key === "string" && key.startsWith("player_")) {
        this.failedPlayerSheets.add(key);
      }
    });
    this.load.once('complete', () => { this.assetsLoaded = true; });
  }

  private resolveAvatarSheetKey(p: { avatarID?: string; avatarUrl?: string }) {
    // Prefer avatarUrl if present (stable), else use avatarID.
    // We seed URL values like /assets/avatars/avatar_blue.svg, but the in-game spritesheets are PNGs:
    // /assets/avatars/player_blue.png
    const url = p.avatarUrl ?? "";
    const id = p.avatarID ?? "";
    const marker = url || id;

    // If it points under /assets/avatars/, treat it as an avatar spritesheet.
    // We expect spritesheets to be PNGs, but if the DB has a .jpg URL while a matching .png exists,
    // we rewrite it (common when images were added as .jpg previews but spritesheet is .png).
    // Only accept known spritesheet formats here. JPEG avatar images in this repo are large photos
    // (e.g. 3000x2000) and are NOT spritesheets; trying to load them as a spritesheet fails.
    if (marker.includes("/assets/avatars/") && marker.toLowerCase().endsWith(".png")) {
      const file = marker.split("/").pop() ?? "";
      const base = file.replace(/\.png$/i, "");
      const url = marker;
      return { key: `player_${base}`, url };
    }

    // If it's avatar_{color}.svg, map to player_{color}.png.
    const m = marker.match(/avatar_(blue|green|purple|orange|red)\.(svg|png)$/i);
    const color = m?.[1]?.toLowerCase();
    if (color) {
      return { key: `player_${color}`, url: `/assets/avatars/player_${color}.png` };
    }

    // As a last resort, fall back to default.
    return { key: "player_default", url: "/assets/image.png" };
  }

  private ensurePlayerSheetLoaded(p: { avatarID?: string; avatarUrl?: string }) {
    const sheet = this.resolveAvatarSheetKey(p);
    if (this.failedPlayerSheets.has(sheet.key)) {
      return "player_default";
    }
    if (this.loadedPlayerSheets.has(sheet.key) || this.textures.exists(sheet.key)) {
      this.loadedPlayerSheets.add(sheet.key);
      return sheet.key;
    }

    this.load.spritesheet(sheet.key, sheet.url, { frameWidth: 32, frameHeight: 48 });
    this.loadedPlayerSheets.add(sheet.key);
    return sheet.key;
  }

  private async loadQueuedAssets() {
    // Phaser will render the green placeholder box if we create sprites before textures are loaded.
    // This helper awaits the loader finishing.
    if (!this.load || (this.load as unknown as { isLoading?: () => boolean }).isLoading?.()) {
      return;
    }

    // If no new files were queued, load.start() is a no-op but safe.
    await new Promise<void>((resolve) => {
      const done = () => {
        this.load.off(Phaser.Loader.Events.COMPLETE, done);
        resolve();
      };
      this.load.once(Phaser.Loader.Events.COMPLETE, done);
      try {
        this.load.start();
      } catch {
        // ignore
        resolve();
      }
    });
  }

  private ensurePlayerAnims(sheetKey: string) {
    const left = `${sheetKey}_left`;
    const right = `${sheetKey}_right`;
    const turn = `${sheetKey}_turn`;

    if (!this.anims.exists(left)) {
      this.anims.create({
        key: left,
        frames: this.anims.generateFrameNumbers(sheetKey, { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!this.anims.exists(right)) {
      this.anims.create({
        key: right,
        frames: this.anims.generateFrameNumbers(sheetKey, { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!this.anims.exists(turn)) {
      this.anims.create({
        key: turn,
        frames: [{ key: sheetKey, frame: 4 }],
        frameRate: 20,
      });
    }
  }

  private sendToServer(x: number, y: number) {
    if (!this.gameWs || !this.userID) return;
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

  public syncPlayers(players: { userID: string; avatarID: string; avatarUrl?: string; x: number; y: number }[]) {
    // Remove left players
    for (const [userID, sprite] of this.playerSprites) {
      if (!players.find(p => p.userID === userID)) {
        sprite.destroy();
        this.playerSprites.delete(userID);
      }
    }
    // Add new players
    players.forEach(player => {
      if (player.userID !== this.userID && !this.playerSprites.has(player.userID)) {
        this.addOtherPlayer(player);
      }
    });
  }

  private addOtherPlayer(player: { userID: string; avatarID?: string; avatarUrl?: string; x: number; y: number }) {
    const sheetKey = this.ensurePlayerSheetLoaded(player);
    this.ensurePlayerAnims(sheetKey);

    // Ensure newly queued loads are started.
    if (this.load.isLoading() === false) {
      // If nothing is loading, start loading anyway.
      try {
        this.load.start();
      } catch {
        // ignore: Phaser loader can throw if it's already running in some states
      }
    }

    const sprite = this.add.sprite(player.x * 50 + 25, player.y * 50 + 25, sheetKey)
      .setScale(1.35)
      .setDepth(1)
      .setInteractive({ cursor: 'pointer' });

    sprite.on('pointerdown', () => {
      // Check distance before dispatching click
      if (this.player) {
        const dx = Math.abs(sprite.x - this.player.x) / 50;
        const dy = Math.abs(sprite.y - this.player.y) / 50;
        if (dx <= this.proximityRadius && dy <= this.proximityRadius) {
          this.game.events.emit('player-clicked', player.userID);
        }
      }
    });

    this.playerSprites.set(player.userID, sprite);
    this.playerSpriteKey.set(player.userID, sheetKey);
  }

  async create() {
    if (!this.gameDimensions) return;
    const gridSize = 50;
    const gridCols = this.gameDimensions.width;
    const gridRows = this.gameDimensions.height;

    const mapWidth = gridCols * gridSize;
    const mapHeight = gridRows * gridSize;

    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // Simple background (solid color)
    this.cameras.main.setBackgroundColor(0x0b1320);

    // Function to update camera bounds for centering
    const updateCameraBounds = () => {
      const screenWidth = this.scale.width;
      const screenHeight = this.scale.height;

      const zoom = this.cameras.main.zoom;

      // Calculate how many screen pixels the map takes at full view
      const displayWidth = mapWidth * zoom;
      const displayHeight = mapHeight * zoom;

      let offsetX = 0;
      let offsetY = 0;

      // If map is smaller than screen, calculate offset to center it
      if (displayWidth < screenWidth) {
        offsetX = (screenWidth - displayWidth) / (2 * zoom);
      }
      if (displayHeight < screenHeight) {
        offsetY = (screenHeight - displayHeight) / (2 * zoom);
      }

      // Set camera bounds: if smaller, we offset the top-left to negative to "push" content to center
      this.cameras.main.setBounds(-offsetX, -offsetY, Math.max(mapWidth + offsetX, screenWidth / zoom), Math.max(mapHeight + offsetY, screenHeight / zoom));

      console.log(`[Phaser] Screen: ${screenWidth}x${screenHeight}, Zoom: ${zoom}, Map: ${mapWidth}x${mapHeight}, Offset: ${offsetX},${offsetY}`);
    };

    updateCameraBounds();
    this.scale.on('resize', updateCameraBounds);
    this.events.on('zoom-changed', updateCameraBounds); // Custom check if zoom ever changes dynamically

    // Floor tile: gives the world a consistent surface. (Also replaces grid look.)
    const floorKey = "floor_tile_generic";
    if (!this.textures.exists(floorKey)) {
      // Reuse an existing floor asset if present.
      // NOTE: `/assets/elements/floor_0.png` is currently not a valid PNG in this repo (can't be decoded),
      // so we use a known-good fallback image.
      this.load.image(floorKey, "/assets/carpet.jpg");
      await this.loadQueuedAssets();

      // If the file exists but failed to decode/process, fall back to a procedural tile.
      if (!this.textures.exists(floorKey)) {
        const g = this.add.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        g.fillStyle(0x1a2330, 1);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0x151d29, 1);
        g.fillRect(0, 0, 32, 32);
        g.fillRect(32, 32, 32, 32);
        g.generateTexture(floorKey, 64, 64);
        g.destroy();
      }
    }
    if (this.textures.exists(floorKey)) {
      const floor = this.add.tileSprite(0, 0, mapWidth, mapHeight, floorKey);
      floor.setOrigin(0, 0);
      floor.setDepth(0);
      floor.setAlpha(0.9);
    }

    if (this.gameWs) {
      const handleMessage = (message: MessageEvent) => {
        const data = JSON.parse(message.data);
        if (data.type === "move") {
          this.updateLocation(data.payload.userID, data.payload.x, data.payload.y);
        } else if (data.type === "user-joined") {
          const p = data.payload;
          if (p.userID !== this.userID && !this.playerSprites.has(p.userID)) {
            this.addOtherPlayer(p);
          }
        } else if (data.type === "user-left") {
          const sprite = this.playerSprites.get(data.payload.userID);
          sprite?.destroy();
          this.playerSprites.delete(data.payload.userID);
        }
      };
      this.gameWs.addEventListener('message', handleMessage);
      this.events.on('destroy', () => this.gameWs?.removeEventListener('message', handleMessage));
    }

    // Static colliders for blocking elements
    this.staticColliders = this.physics.add.staticGroup();

    this.gameElements.forEach((element, index) => {
      const uniqueKey = `dynamicImage-${index}`;
      const imageUrl = element.element.imageUrl;
      if (imageUrl.startsWith("/")) {
        this.load.image(uniqueKey, imageUrl);
      } else {
        this.load.image(uniqueKey, `http://localhost:3000/api/v1/proxy-image/${imageUrl}`);
      }
      this.load.once(`filecomplete-image-${uniqueKey}`, () => {
        const worldX = element.x * gridSize;
        const worldY = element.y * gridSize;

        // Center based on element's grid width/height.
        const w = Math.max(1, element.element.width ?? 1);
        const h = Math.max(1, element.element.height ?? 1);
        const cx = worldX + (w * gridSize) / 2;
        const cy = worldY + (h * gridSize) / 2;

        const img = this.add.image(cx, cy, uniqueKey);
        img.setDepth(0.5);

        // Scale asset to fit the desired grid footprint.
        const tex = this.textures.get(uniqueKey);
        const source = tex?.getSourceImage?.();

        const hasWH = (o: unknown): o is { width: number; height: number } => {
          return typeof (o as { width?: unknown }).width === 'number' && typeof (o as { height?: unknown }).height === 'number';
        };

        const srcW = hasWH(source) ? source.width : img.width;
        const srcH = hasWH(source) ? source.height : img.height;
        const targetW = w * gridSize;
        const targetH = h * gridSize;
        const scaleX = targetW / srcW;
        const scaleY = targetH / srcH;
        const scale = Math.min(scaleX, scaleY);
        img.setScale(scale);

        const isStatic = element.element.static === true;
        if (isStatic && this.staticColliders) {
          const collider = this.staticColliders.create(cx, cy, uniqueKey);
          collider.setScale(img.scaleX, img.scaleY);
          collider.refreshBody();
          collider.setVisible(false);
        }
      });

      // If the image fails to load/decode, use a placeholder texture.
      this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
        const key = (file as unknown as { key?: string }).key;
        if (key !== uniqueKey) return;
        if (this.textures.exists(uniqueKey)) return;

        const g = this.add.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        g.fillStyle(0x334155, 1);
        g.fillRect(0, 0, 64, 64);
        g.lineStyle(4, 0xef4444, 1);
        g.strokeRect(2, 2, 60, 60);
        g.generateTexture(uniqueKey, 64, 64);
        g.destroy();

        const worldX = element.x * gridSize;
        const worldY = element.y * gridSize;
        const w = Math.max(1, element.element.width ?? 1);
        const h = Math.max(1, element.element.height ?? 1);
        const cx = worldX + (w * gridSize) / 2;
        const cy = worldY + (h * gridSize) / 2;
        const img = this.add.image(cx, cy, uniqueKey);
        img.setDepth(0.5);
      });
    });
    await this.loadQueuedAssets();

    // Queue spritesheets for all known players before creating sprites.
    this.gamePlayers.forEach(p => {
      this.ensurePlayerSheetLoaded(p);
    });
    // Always ensure default exists.
    this.ensurePlayerSheetLoaded({ avatarUrl: "/assets/image.png" });
    await this.loadQueuedAssets();

    this.gamePlayers.forEach(p => {
      if (p.userID !== this.userID) this.addOtherPlayer(p);
    });

    const myPlayer = this.gamePlayers.find(p => p.userID === this.userID)!;
    const mySheet = this.ensurePlayerSheetLoaded(myPlayer);
    const resolvedMySheet = this.textures.exists(mySheet) ? mySheet : "player_default";
    this.ensurePlayerAnims(resolvedMySheet);
    this.player = this.physics.add.sprite(myPlayer.x * 50 + 25, myPlayer.y * 50 + 25, resolvedMySheet).setDepth(1).setScale(1.35);
    this.playerSpriteKey.set(this.userID ?? "", resolvedMySheet);
    this.player.setCollideWorldBounds(true);

    if (this.staticColliders) {
      this.physics.add.collider(this.player, this.staticColliders);
    }
    this.lastSentGridX = myPlayer.x;
    this.lastSentGridY = myPlayer.y;

    // Per-avatar anims are created lazily via ensurePlayerAnims.
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1.2);
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  update() {
    if (!this.player || !this.cursors) return;
    const speed = 200;
    this.player.setVelocity(0);

    const cx = Math.floor(this.player.x / 50);
    const cy = Math.floor(this.player.y / 50);

    // Proximity aura: show a subtle field around nearby users (no tinting).
    this.playerSprites.forEach((sprite, userId) => {
      const dx = Math.abs(sprite.x - this.player.x) / 50;
      const dy = Math.abs(sprite.y - this.player.y) / 50;
      const nearby = dx <= this.proximityRadius && dy <= this.proximityRadius;

      const existing = this.proximityAuras.get(userId);
      if (!nearby) {
        existing?.destroy();
        this.proximityAuras.delete(userId);
        return;
      }

      const radiusPx = 38;
      if (!existing) {
        const aura = this.add.circle(sprite.x, sprite.y + 6, radiusPx, 0x60a5fa, 0.14);
        aura.setStrokeStyle(2, 0x93c5fd, 0.25);
        aura.setDepth(0.9);
        this.proximityAuras.set(userId, aura);
      } else {
        existing.setPosition(sprite.x, sprite.y + 6);
      }
    });

    const shouldSend = (cx !== this.lastSentGridX || cy !== this.lastSentGridY);

    const mySheet = this.playerSpriteKey.get(this.userID ?? "") ?? (this.player.texture?.key || "player_default");
    const leftAnim = `${mySheet}_left`;
    const rightAnim = `${mySheet}_right`;
    const turnAnim = `${mySheet}_turn`;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.anims.play(leftAnim, true);
      if (shouldSend) { this.sendToServer(cx, cy); this.lastSentGridX = cx; this.lastSentGridY = cy; }
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.anims.play(rightAnim, true);
      if (shouldSend) { this.sendToServer(cx, cy); this.lastSentGridX = cx; this.lastSentGridY = cy; }
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      if (shouldSend) { this.sendToServer(cx, cy); this.lastSentGridX = cx; this.lastSentGridY = cy; }
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
      if (shouldSend) { this.sendToServer(cx, cy); this.lastSentGridX = cx; this.lastSentGridY = cy; }
    } else {
      this.player.anims.play(turnAnim);
    }
  }
}

// React UI Overlay Components
type InteractionMenuProps = {
  userLabel?: string;
  onClose: () => void;
  onChat: () => void;
  onCall: () => void;
};

type ChatMessage = { from: string; text: string };

type ChatWindowProps = {
  targetUser: string;
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onClose: () => void;
};

type IncomingCallProps = {
  from: string;
  onAccept: () => void;
  onDecline: () => void;
};

type ActiveCallProps = {
  target: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micEnabled: boolean;
  camEnabled: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onEnd: () => void;
};

const InteractionMenu = ({ userLabel, onClose, onChat, onCall }: InteractionMenuProps) => (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-xl z-50 animate-fade-in-up w-64">
    <h3 className="text-lg font-bold text-white mb-4 text-center">
      Interact with {userLabel ?? "User"}
    </h3>
    <div className="flex gap-4">
      <button onClick={onChat} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold">Chat</button>
      <button onClick={onCall} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold">Call</button>
    </div>
    <button onClick={onClose} className="mt-4 w-full text-gray-500 hover:text-gray-300 text-sm">Cancel</button>
  </div>
);

const ChatWindow = ({ targetUser, messages, onSend, onClose }: ChatWindowProps) => {
  const [msg, setMsg] = useState("");
  return (
    <div className="absolute bottom-20 right-8 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-xl z-50 flex flex-col h-96">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-2xl">
        <span className="font-bold text-white">Chat with {targetUser}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.map((m: ChatMessage, i: number) => (
          <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-xl max-w-[80%] break-words ${m.from === 'me' ? 'bg-blue-600' : 'bg-gray-700'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-700 flex gap-2">
        <input
          className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (onSend(msg), setMsg(""))}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
};

const IncomingCall = ({ from, onAccept, onDecline }: IncomingCallProps) => (
  <div className="absolute top-10 right-10 bg-gray-900 border-2 border-purple-500 p-4 rounded-xl shadow-2xl z-50 animate-pulse">
    <p className="text-white font-bold mb-3">Incoming call from {from}...</p>
    <div className="flex gap-2">
      <button onClick={onAccept} className="bg-green-500 px-4 py-1 rounded text-white font-bold">Accept</button>
      <button onClick={onDecline} className="bg-red-500 px-4 py-1 rounded text-white font-bold">Decline</button>
    </div>
  </div>
);

const ActiveCall = ({
  target,
  localStream,
  remoteStream,
  micEnabled,
  camEnabled,
  onToggleMic,
  onToggleCam,
  onEnd,
}: ActiveCallProps) => {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 border border-purple-500 p-4 rounded-2xl shadow-2xl z-50 w-[680px] max-w-[95vw]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-white font-bold">📞 In Call with {target}</div>
        <button onClick={onEnd} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg font-bold">End</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl overflow-hidden bg-black/40">
          <div className="text-xs text-white/70 px-2 py-1">You</div>
          <video ref={localRef} autoPlay muted playsInline className="w-full h-48 object-cover" />
        </div>
        <div className="rounded-xl overflow-hidden bg-black/40">
          <div className="text-xs text-white/70 px-2 py-1">{target}</div>
          <video ref={remoteRef} autoPlay playsInline className="w-full h-48 object-cover" />
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={onToggleMic}
          className={`flex-1 ${micEnabled ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-700 hover:bg-gray-600"} text-white py-2 rounded-xl font-bold`}
        >
          {micEnabled ? "Mute Mic" : "Unmute Mic"}
        </button>
        <button
          onClick={onToggleCam}
          className={`flex-1 ${camEnabled ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-700 hover:bg-gray-600"} text-white py-2 rounded-xl font-bold`}
        >
          {camEnabled ? "Turn Camera Off" : "Turn Camera On"}
        </button>
      </div>
    </div>
  );
};

const Game: React.FC<GameProps> = ({ elements, dimensions, ws, players, userID }) => {
  const gameContainer = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GameScene | null>(null);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ from: string, text: string }[]>([]);

  // Call State
  const [incomingCall, setIncomingCall] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<string | null>(null);

  const getDisplayName = (id: string | null | undefined) => {
    if (!id) return "";
    const p = players.find((x) => x.userID === id);
    return p?.username?.trim() || id;
  };

  // WebRTC State
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const peerIdRef = useRef<string | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const sendSignal = (to: string, signal: WebRTCSignal) => {
    if (!ws) return;
    ws.send(
      JSON.stringify({
        type: "webrtc-signal",
        payload: { to, signal },
      }),
    );
  };

  const cleanupCall = () => {
    try {
      pcRef.current?.close();
    } catch {
      // ignore
    }
    pcRef.current = null;
    pendingIceRef.current = [];
    peerIdRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setMicEnabled(true);
    setCamEnabled(true);
    setIncomingCall(null);
    setActiveCall(null);
  };

  const ensurePeerConnection = async (peerId: string) => {
    if (pcRef.current) return pcRef.current;

    peerIdRef.current = peerId;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
    });
    pcRef.current = pc;

    const remote = new MediaStream();
    remoteStreamRef.current = remote;
    setRemoteStream(remote);

    pc.ontrack = (ev) => {
      const stream = ev.streams[0];
      if (!stream) return;
      stream.getTracks().forEach((t) => remote.addTrack(t));
    };

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      sendSignal(peerId, { kind: "ice", candidate: ev.candidate.toJSON() });
    };

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "failed" || s === "disconnected" || s === "closed") cleanupCall();
    };

    // Ask permissions only AFTER the call is accepted.
    const local = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    local.getAudioTracks().forEach((t) => (t.enabled = micEnabled));
    local.getVideoTracks().forEach((t) => (t.enabled = camEnabled));
    localStreamRef.current = local;
    setLocalStream(local);
    local.getTracks().forEach((track) => pc.addTrack(track, local));

    return pc;
  };

  const startOffer = async (peerId: string) => {
    const pc = await ensurePeerConnection(peerId);
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(offer);
    sendSignal(peerId, { kind: "offer", sdp: offer });
  };

  const startOfferRef = useRef<(peerId: string) => Promise<void>>(
    async () => {
      // assigned after definitions
    },
  );
  const handleSignalRef = useRef<(from: string, signal: WebRTCSignal) => Promise<void>>(
    async () => {
      // assigned after definitions
    },
  );

  useEffect(() => {
    startOfferRef.current = startOffer;
    handleSignalRef.current = handleSignal;
  });

  const handleSignal = async (from: string, signal: WebRTCSignal) => {
    if (signal.kind === "hangup") {
      cleanupCall();
      return;
    }

    if (signal.kind === "ice") {
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        pendingIceRef.current.push(signal.candidate);
        return;
      }
      try {
        await pc.addIceCandidate(signal.candidate);
      } catch {
        // ignore
      }
      return;
    }

    if (signal.kind === "offer") {
      const pc = await ensurePeerConnection(from);
      await pc.setRemoteDescription(signal.sdp);

      for (const c of pendingIceRef.current) {
        try {
          await pc.addIceCandidate(c);
        } catch {
          // ignore
        }
      }
      pendingIceRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(from, { kind: "answer", sdp: answer });
      return;
    }

    if (signal.kind === "answer") {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(signal.sdp);

      for (const c of pendingIceRef.current) {
        try {
          await pc.addIceCandidate(c);
        } catch {
          // ignore
        }
      }
      pendingIceRef.current = [];
    }
  };

  useEffect(() => {
    if (!gameContainer.current) return;
    if (sceneRef.current) return; // Prevent duplicate scenes

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainer.current,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%',
      },
      physics: { default: "arcade", arcade: { debug: false } },
      scene: GameScene
    };

    const game = new Phaser.Game(config);
    game.events.once('ready', () => {
      const scene = game.scene.getScene('GameScene') as GameScene;
      if (scene) {
        scene.init({ elements, dimensions, ws, players, userID });
        sceneRef.current = scene;
        scene.game.events.on('player-clicked', (id: string) => {
          setSelectedUser(id);
        });
      }
    });

    return () => {
      game.destroy(true);
      sceneRef.current = null;
    };
  }, [elements, dimensions, ws, userID, players]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.syncPlayers(players);
  }, [players]);

  // WebSocket Message Handling for Chat/Call
  useEffect(() => {
    if (!ws) return;

    const handleMsg = (e: MessageEvent) => {
      const data = JSON.parse(e.data);

      if (data.type === "direct-message") {
        setChatTarget(prev => {
          if (prev !== data.payload.from) return prev; // Only show if chat open? Ideally show notification.
          // For simplicity, just append if it's from current chat target, or maybe global notification
          return prev;
        });
        // Simple: If we receive a message, just open chat for now if closed?
        // Or better: Append to messages list if from chatTarget.
        setMessages(prev => [...prev, { from: data.payload.from, text: data.payload.message }]);
        // Optional: Open chat if close
        if (!chatOpen) {
          setChatTarget(data.payload.from);
          setChatOpen(true);
        }
      }
      else if (data.type === "call-request") {
        setIncomingCall(data.payload.from);
      }
      else if (data.type === "call-response") {
        if (data.payload.accepted) {
          setActiveCall(data.payload.from);
          startOfferRef.current(data.payload.from);
        } else {
          alert("Call declined");
          setActiveCall(null);
        }
      }
      else if (data.type === "webrtc-signal") {
        const from = data.payload.from as string;
        const signal = data.payload.signal as WebRTCSignal;
        handleSignalRef.current(from, signal);
      }
    };

    ws.addEventListener('message', handleMsg);
    return () => ws.removeEventListener('message', handleMsg);
  }, [ws, chatOpen, chatTarget]);

  // Actions
  const handleStartChat = () => {
    setChatTarget(selectedUser);
    setChatOpen(true);
    setMessages([]); // Load history?
    setSelectedUser(null);
  };

  const handleSendChat = (text: string) => {
    if (!chatTarget || !ws) return;
    ws.send(JSON.stringify({
      type: "direct-message",
      payload: { to: chatTarget, message: text }
    }));
    setMessages(prev => [...prev, { from: 'me', text }]);
  };

  const handleStartCall = () => {
    if (!selectedUser || !ws) return;
    ws.send(JSON.stringify({
      type: "call-request",
      payload: { to: selectedUser }
    }));
    setSelectedUser(null);
    // Show "Calling..." state?
  };

  const handleAcceptCall = () => {
    if (!incomingCall || !ws) return;
    ws.send(JSON.stringify({
      type: "call-response",
      payload: { to: incomingCall, accepted: true }
    }));
    setActiveCall(incomingCall);
    // As callee, prepare local media and peer connection; offer will arrive and we answer.
    ensurePeerConnection(incomingCall);
    setIncomingCall(null);
  };

  const handleDeclineCall = () => {
    if (!incomingCall || !ws) return;
    ws.send(JSON.stringify({
      type: "call-response",
      payload: { to: incomingCall, accepted: false }
    }));
    setIncomingCall(null);
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div ref={gameContainer} className="w-full h-full" />

      {selectedUser && (
        <InteractionMenu
          userLabel={getDisplayName(selectedUser)}
          onClose={() => setSelectedUser(null)}
          onChat={handleStartChat}
          onCall={handleStartCall}
        />
      )}

      {chatOpen && chatTarget && (
        <ChatWindow
          targetUser={getDisplayName(chatTarget)}
          messages={messages.filter((m) => m.from === chatTarget || m.from === 'me')}
          onSend={handleSendChat}
          onClose={() => setChatOpen(false)}
        />
      )}

      {incomingCall && (
        <IncomingCall
          from={getDisplayName(incomingCall)}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {activeCall && (
        <ActiveCall
          target={getDisplayName(activeCall)}
          localStream={localStream}
          remoteStream={remoteStream}
          micEnabled={micEnabled}
          camEnabled={camEnabled}
          onToggleMic={() => {
            const next = !micEnabled;
            setMicEnabled(next);
            localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
          }}
          onToggleCam={() => {
            const next = !camEnabled;
            setCamEnabled(next);
            localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
          }}
          onEnd={() => {
            const peer = peerIdRef.current;
            if (peer) sendSignal(peer, { kind: "hangup" });
            cleanupCall();
          }}
        />
      )}
    </div>
  );
};

export default Game;