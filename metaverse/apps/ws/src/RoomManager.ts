import type { User } from "./User";
import { OutgoingMessage } from "./types";

export class RoomManager {
    rooms: Map<string, User[]> = new Map();
    static instance: RoomManager;

    private constructor() {
        this.rooms = new Map();
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new RoomManager();
        }
        return this.instance;
    }

    public removeUser(user: User, spaceId: string) {
        if (!this.rooms.has(spaceId)) {
            return;
        }
        this.rooms.set(spaceId, (this.rooms.get(spaceId)?.filter((u) => u.id !== user.id) ?? []));
    }

    public addUser(spaceId: string, user: User) {
        if (!this.rooms.has(spaceId)) {
            // Create a new room if it doesn't exist
            this.rooms.set(spaceId, [user]);
            return;
        }
    
        // Check if the user is already in the room
        const existingUsers = this.rooms.get(spaceId) ?? [];
        const userExists = existingUsers.some((u) => u.userId === user.userId);
    
        if (!userExists) {
            // Only add the user if they are not already in the room
            this.rooms.set(spaceId, [...existingUsers, user]);
        }
    }
    

    public broadcast(message: OutgoingMessage, user: User, roomId: string) {
        if (!this.rooms.has(roomId)) {
            return;
        }
        this.rooms.get(roomId)?.forEach((u) => {
            if (u.id !== user.id) {
                u.send(message);
            }
        });
    }
}