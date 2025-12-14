import { WebSocket } from 'ws';
import { RoomManager } from './RoomManager';
import { OutgoingMessage } from './types';
import client from "@repo/db/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_PASSWORD } from './config';
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
    public userId?:string;
    private spaceId?:string;
    private x:number;
    private y:number;
    private ws:WebSocket;
     constructor( ws:WebSocket){
     this.id=getRandomString(10);
    this.x=0;
    this.y=0;
    this.ws=ws;
    this.initHandlers();
     }
     
     initHandlers(){
      
         this.ws.on('message',async (message)=> {
        // console.log('received: %s', message);
       
        const data = JSON.parse(message.toString());
        console.log(data);
         if(data.type==="join"){
            const token=data.payload.token;
            const spaceID=data.payload.spaceID;
            const userID=(jwt.verify(token,JWT_PASSWORD) as JwtPayload).userID;
            if(!userID){
                this.ws.close();
                return;
            }
            this.userId=userID;
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
                    users:RoomManager.getInstance().rooms.get(spaceID)?.map(u=>u.userId)
                }});

            RoomManager.getInstance().broadcast({
                type:"user-joined",
                payload:{
                    userID:this.userId,
                    spaceID:spaceID,
                    x:this.x,
                    y:this.y
                }
            },this,this.spaceId!);
          
        }
        if(data.type==="move"){
            const moveX=data.payload.x;
            const moveY=data.payload.y;
            const xDisplacement=Math.abs(this.x-moveX);
            const yDisplacement=Math.abs(this.y-moveY);
            // console.log("Moving baby",xDisplacement,yDisplacement)
            // console.log("Current position",this.x,this.y)
            // console.log("Target position",moveX,moveY)
            if((xDisplacement==1 && yDisplacement==0)||(xDisplacement==0 && yDisplacement==1)){
                this.x=moveX;
                this.y=moveY;
                console.log("Nothing can stop me now")
                RoomManager.getInstance().broadcast({
                type:"move",
                payload:{
                    x:this.x,
                    y:this.y,
                    userID:this.userId
                }
            },this, this.spaceId!);
            return;
            }
            this.send({
            type:"movement-rejected",
            payload:{
                x:this.x,
                y:this.y
            }
             });
    
        
    }
    if(data.type==="user-left"){
        RoomManager.getInstance().broadcast({
            type:"user-left",
            payload:{
                userID:this.userId, 
                spaceID:this.spaceId!
            }
        },this,this.spaceId!);
        RoomManager.getInstance().removeUser(this,this.spaceId!);
    }

    });
    }
        destroy(){
            RoomManager.getInstance().broadcast({
                type:"user-left",
                payload:{
                    userID:this.userId,
                   
                }
            },this,this.spaceId!);
            RoomManager.getInstance().removeUser(this,this.spaceId!);
        }
        send(payload: OutgoingMessage) {
            this.ws.send(JSON.stringify(payload));
        }

};