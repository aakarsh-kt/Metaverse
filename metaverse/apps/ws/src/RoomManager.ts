import type { User } from "./User";
import { OutgoingMessage } from "./types";

export class RoomManager {
    public rooms: Map<string, User[]> = new Map();
    private static instance: RoomManager;

    private constructor() {}

    static getInstance() {
        if (!this.instance) {
            this.instance = new RoomManager();
        }
        return this.instance;
    }

    public addUser(spaceId: string, user: User) {
        const room = this.rooms.get(spaceId) ?? [];

        const exists = room.some(u => u.userId === user.userId);
        if (exists) return;

        this.rooms.set(spaceId, [...room, user]);
        console.log(`User ${user.userId} joined space ${spaceId}`);
    }

    public removeUser(user: User, spaceId: string) {
        const room = this.rooms.get(spaceId);
        if (!room) return;

        const updatedRoom = room.filter(u => u.userId !== user.userId);

        if (updatedRoom.length === 0) {
            this.rooms.delete(spaceId);
            console.log(`Space ${spaceId} deleted (empty)`);
        } else {
            this.rooms.set(spaceId, updatedRoom);
        }

        console.log(`User ${user.userId} removed from space ${spaceId}`);
    }

    public broadcast(
        message: OutgoingMessage,
        sender: User,
        spaceId: string
    ) {
        const room = this.rooms.get(spaceId);
        if (!room) return;

        for (const user of room) {
            if (user.id !== sender.id) {
                user.send(message);
            }
        }
    }
}
