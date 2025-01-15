import { WebSocket } from 'ws';
import { RoomManager } from './RoomManager';
import { OutgoingMessage } from './types';
import client from "@repo/db/client";

function getRandomString(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export class User {

    public id:string;
    private spaceId?:string;
    private x:number;
    private y:number;
     constructor(private ws:WebSocket){
     this.id=getRandomString(10);
    this.x=0;
    this.y=0;
     }
     
     initHandlers(){
      
         this.ws.on('message',async (message)=> {
        console.log('received: %s', message);
       
        const data = JSON.parse(message.toString());
         if(data.type==="join"){
            const token=data.payload.token;
            const spaceID=data.payload.spaceID;
            const space=await client.space.findFirst({
                where:{
                    spaceID:spaceID
                }
            });
            if(!space){
                this.ws.close();
                return;
            }
            RoomManager.getInstance().addUser(spaceID,this);
            this.spaceId=spaceID;
            this.x=Math.floor(Math.random()*space?.width);
            this.y=Math.floor(Math.random()*space?.height);
            this.send({
                type:"space-joined",
                payload:{
                    spawn:{
                        x:this.x,
                        y:this.y
                    },
                    users:RoomManager.getInstance().rooms.get(spaceID)?.map(u=>u.id)
                }});

            RoomManager.getInstance().broadcast({
                type:"user-joined",
                payload:{
                    userID:this.id,
                    spaceID:spaceID,
                    x:this.x,
                    y:this.y
                }
            },this,spaceID);
          
        }
        if(data.type==="move"){
            const moveX=data.payload.x;
            const moveY=data.payload.y;
            const xDisplacement=Math.abs(this.x-moveX);
            const yDisplacement=Math.abs(this.y-moveY);
            if((xDisplacement==1 && yDisplacement==0)||(xDisplacement==0 && yDisplacement==1)){
                this.x=moveX;
                this.y=moveY;
            this.send({
                type:"move",
                payload:{
                    x:this.x,
                    y:this.y
                }
            });
            return;
        }
        this.send({
            type:"move-rejected",
            payload:{
                x:this.x,
                y:this.y
            }
        });
    
        
    }});
    }

        send(payload: OutgoingMessage) {
            this.ws.send(JSON.stringify(payload));
        }

};