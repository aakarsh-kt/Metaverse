import { Router } from "express";
import { adminMiddleware } from "../../middleware/admin";
export const adminRouter = Router();
import { CreateAvatarSchema, createElementSchema, CreateMapSchema } from "../../types";
import client from "@repo/db/client"




adminRouter.post("/avatar",adminMiddleware,async(req,res)=>{

    const parsedData = CreateAvatarSchema.safeParse(req.body);
   
    if(!parsedData.success)
    {
        res.status(400).json({
            message:"Validation failed"
        })
        return 
    }
    try{
        const avatar = await client.avatar.create({
            data:{
                name:parsedData.data.name,
                url:parsedData.data.imageUrl,
            }
            
        })

        res.status(200).json({
            avatarID: avatar.avatarID
        })
        // return 
    }
    catch(e){
        
        res.status(400).json({
            message: "Avatar Creation failed"
        })
        return 
    }
   

})

adminRouter.post("/element",adminMiddleware,async(req ,res)=>{
    const parsedData=createElementSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({
            message:"Invalid element data"
        })
        return
    }
    try{
        const element= await client.element.create({
            data:{
              height:(parsedData.data.height),
              width:(parsedData.data.width),
              imageUrl:parsedData.data?.imageUrl,

            }
        })

        res.status(200).json({
            elementID:element.elementID
        })
        return
    }
    catch(e){
        res.status(400).json({
            message:"Element creation failed"
        })
        return
    }
})
adminRouter.post("/map",adminMiddleware,async(req,res)=>{

    const parsedData=CreateMapSchema.safeParse(req.body);
    if(!parsedData.success){
      
        res.status(400).json({
            message:"Invalid data",
            error:parsedData.error
        })
        return 
    }
    try{
        const map= await client.map.create({
            data:{
                name:parsedData.data.name,
                thumbnail:parsedData.data.thumbnail,
                width:parseInt(parsedData.data.dimensions.split('x')[0]),
                height:parseInt(parsedData.data.dimensions.split('x')[1]),
                mapElements: {
                    create: parsedData.data.defaultElements.map((e) => ({
                        elementID: e.elementID,
                        x: e.x, // Ensure x is a number
                        y: e.y, // Ensure y is a number
                    })),
                },
            }
        })

        if(!map){
            res.status(400).json({
                message:"Map creation failed"
            })
            return
        }
        res.status(200).json({
            mapID:map.mapID
        })

    }
    catch(e){
        res.status(400).json({
            message: "Invalid data to create a map",
            error:e
        })
    }

})