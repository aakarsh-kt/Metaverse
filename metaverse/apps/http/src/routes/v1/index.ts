import { Router } from "express";
import { spaceRouter } from "./spaceRouter";
import {userRouter} from "./userRouter";
export const router=Router();
import { signInSchema, signUpSchema } from "../../types";
import jwt from "jsonwebtoken"
import client from "@repo/db/client";
import { JWT_PASSWORD } from "../../config";
import {hash,compare} from "../../scrypt"

import { adminRouter } from "./adminRouter";
import { adminMiddleware } from "../../middleware/admin";
router.get("/health",async(req , res)=>{
    res.status(200).json({
        message: "Connection to the HTTP server successful"
    })
})
router.post("/signup",async (req,res)=>{

    console.log("Signing up");
    const parsedData=signUpSchema.safeParse(req.body);
    if(!(parsedData.success))
     {   res.status(400).json({
        message:"Sign Up Failed",
        error:parsedData.error
     });
         return;
     }
   else{

    try{
       
        const hashedPassword= await hash(parsedData.data.password);
           const user= await client.user.create({
                data:{
                    username:parsedData.data.username,
                    password:hashedPassword,
                    role:parsedData.data.type==='admin'?"admin":"user"
                }
            })
            res.status(200).json({
               userID:user.id
            })
    }
    catch(e){
            res.status(400).json({
                message:"Failed",
                error:e
            })
    }
    
  
        return;
}
})

router.post("/signin",async(req,res)=>{
    const parsedData=signInSchema.safeParse(req.body);

    if(!(parsedData.success))
    {
        res.status(400).json({
            message:"Failed"
        });
        return ;
    }
    else{
        try{
            const user= await client.user.findUnique({
                where: {
                    username:parsedData.data.username
                }
            })
            if(!user)
            {
                res.status(403).json({
                    message:"NO user Found"
                })
                return ;
            }
            const isValid=compare(parsedData.data.password,user.password);
            if(!isValid)
            {
                res.status(403).json({
                    message:"Wrong Password"
                })
            }
            const token=jwt.sign({
                userID:user.id,
                role:user.role
            },JWT_PASSWORD)
            res.status(200).json({
                token
            })
        }
        catch(e){
            res.json({message:"Failed"})
        }
    }
       
})
router.use("/checkAdmin",adminMiddleware,async(req,res)=>{
    const userId=req.userID;
    try{
        const user=await client.user.findUnique({
            where:{
                id:userId
            },
            select:{
                role:true
            }
        })
        if(user?.role=="admin")
        {
            res.status(200).json({
                message:"Admin"
            })
            return 
        }
        else{
            res.status(403).json({
                message:"Not an admin"
            })
            return 
        }
    }
    catch(e){
        res.status(400).json({
            message:"No user found"
        })
    }
})
router.use("/user",userRouter);
router.use("/admin",adminRouter);
router.get("/avatars",async(req,res)=>{

    try{
        const avatars=await client.avatar.findMany();

        res.status(200).json({
            avatars: avatars.map(e=>({
                avatarID:e.avatarID,
                imageUrl:e.url,
                name:e.name
            }))
        })
    }
    catch(e){
        res.status(400).json({
            message:"Error finding avatars"
        })
    }
   
})
router.use("/space",spaceRouter);