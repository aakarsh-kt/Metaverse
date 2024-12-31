import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";
import { NextFunction,Request,Response } from "express";
import { decode } from "punycode";

export const adminMiddleware=(req:Request,res:Response,next:NextFunction)=>{

        const header=req.headers["authorization"];
        const token=header?.split(" ")[1];
        
        if(!token){
            
            res.status(403).json({
                message:"Unauthorized"
            })
            return
        }
        try{
            const decoded=jwt.verify(token,JWT_PASSWORD) as {role:string , userID:string}
            
            if(decoded.role!=="admin"){
                res.status(403).json({
                    message:"Unauthorised"
                })
                return  
            }

            req.userID=decoded.userID
            next()
        }
        catch(e){
            
            res.status(401).json({
                message:"Unauthorized"
            })
            return 
        }
}
