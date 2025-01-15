import { OutgoingMessage } from "./types";
import {User} from "./User";

export class RoomManager {
     rooms:Map<string,User[]>=new Map();
    static instance:RoomManager;
    private constructor(){
        this.rooms=new Map();
    }
    static getInstance(){
        if(!this.instance){
            this.instance=new RoomManager();
        }   
       return RoomManager.instance;
    }
    public addUser(spaceID:string,user:any){
      if(!this.rooms.has(spaceID)){
          this.rooms.set(spaceID,[user]);
            return;
        }

        this.rooms.set(spaceID,[...this.rooms.get(spaceID) ?? [],user]);

       
    }
    public broadcast(messsage: OutgoingMessage,user: User,roomID:string){
      if(!this.rooms.has(roomID)){
          return;
      }
      this.rooms.get(roomID)?.forEach(u=>{
            if(u.id!==user.id){
                u.send(messsage);
            }
      });
    }
}