import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";
import { OutgoingMessage } from "./types";
import client from "@repo/db/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";

function getRandomString(length: number) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export class User {
    public id: string;              // connection-level id
    public userId?: string;         // actual user id
    private spaceId?: string;

    public x = 0;
    public y = 0;

    private ws: WebSocket;
    private roomManager: RoomManager;
    private destroyed = false;

    constructor(ws: WebSocket) {
        this.id = getRandomString(10);
        this.ws = ws;
        this.roomManager = RoomManager.getInstance();
        this.initHandlers();
    }

    private initHandlers() {
        this.ws.on("message", async (message) => {
            let data: any;
            try {
                data = JSON.parse(message.toString());
            } catch {
                return;
            }

            if (data.type === "join") {
                await this.handleJoin(data);
                return;
            }

            if (data.type === "move") {
                this.handleMove(data);
                return;
            }

            if (data.type === "log-active-players") {
                const users = this.roomManager.rooms.get(this.spaceId ?? "");
                console.log(`Active users in ${this.spaceId}:`, users?.map(u => u.userId));
                return;
            }

            if (data.type === "chat" || data.type === "emote") {
                this.roomManager.broadcast({
                    type: data.type,
                    payload: {
                        from: this.userId,
                        ...data.payload
                    }
                }, this, this.spaceId ?? "");
                return;
            }

            if (data.type === "direct-message" ||
                data.type === "call-request" ||
                data.type === "call-response" ||
                data.type === "webrtc-signal") {

                const { to, ...payload } = data.payload;
                const room = this.roomManager.rooms.get(this.spaceId ?? "");
                const targetUser = room?.find(u => u.userId === to);

                if (targetUser) {
                    console.log(`[User ${this.userId}] Forwarding ${data.type} to ${to}`);
                    targetUser.send({
                        type: data.type,
                        payload: {
                            from: this.userId,
                            ...payload
                        }
                    });
                } else {
                    console.warn(`[User ${this.userId}] Target user ${to} not found in room ${this.spaceId} for ${data.type}`);
                }
                return;
            }
        });

        this.ws.on("close", () => {
            console.log("Socket closed:", this.userId);
            this.destroy();
        });

        this.ws.on("error", () => {
            this.destroy();
        });
    }

    private async handleJoin(data: any) {
        try {
            const token = data.payload.token;
            const spaceID = data.payload.spaceID;

            const decoded = jwt.verify(token, JWT_PASSWORD) as JwtPayload;
            const userID = decoded.userID;

            if (!userID) {
                this.ws.close();
                return;
            }

            const space = await client.space.findFirst({
                where: { spaceID }
            });

            if (!space) {
                this.ws.close();
                return;
            }

            this.userId = userID;
            this.spaceId = spaceID;

            this.x = Math.floor(Math.random() * space.width);
            this.y = Math.floor(Math.random() * space.height);

            this.roomManager.addUser(spaceID, this);

            this.send({
                type: "space-joined",
                payload: {
                    spawn: { x: this.x, y: this.y },
                    users: this.roomManager.rooms
                        .get(spaceID)
                        ?.filter(u => u.id !== this.id)
                        ?.map((u) => ({
                            userId: u.userId,
                            x: u.x,
                            y: u.y,
                        })) ?? [],
                },
            });

            this.roomManager.broadcast(
                {
                    type: "user-joined",
                    payload: {
                        userID: this.userId,
                        spaceID,
                        x: this.x,
                        y: this.y,
                    },
                },
                this,
                spaceID
            );
        } catch {
            this.ws.close();
        }
    }

    private handleMove(data: any) {
        if (!this.spaceId || !this.userId) {
            console.log(`[User ${this.userId}] Cannot handle move: spaceId=${this.spaceId}, userId=${this.userId}`);
            return;
        }

        const { x, y } = data.payload;
        console.log(`[User ${this.userId}] Received move request: from=(${this.x}, ${this.y}) to=(${x}, ${y})`);

        // Trust client position - no validation
        this.x = x;
        this.y = y;

        console.log(`[User ${this.userId}] Broadcasting move to room ${this.spaceId}`);
        this.roomManager.broadcast(
            {
                type: "move",
                payload: {
                    userID: this.userId,
                    x: this.x,
                    y: this.y,
                },
            },
            this,
            this.spaceId
        );
    }

    public destroy() {
        if (this.destroyed) return;
        this.destroyed = true;

        if (!this.spaceId || !this.userId) return;

        this.roomManager.removeUser(this, this.spaceId);

        this.roomManager.broadcast(
            {
                type: "user-left",
                payload: {
                    userID: this.userId,
                    spaceID: this.spaceId,
                },
            },
            this,
            this.spaceId
        );
    }

    public send(payload: OutgoingMessage) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }
    }
}
