import { Router } from "express";
import client from "@repo/db/client"
import { AddElementSchema, createSpaceSchema, DeleteElementSchema } from "../../types";

import { userMiddleware } from "../../middleware/user";

export const spaceRouter=Router();

spaceRouter.use("/all",userMiddleware,async (req,res)=>{
    
    const userId=req.userID;

    try{
        const spaces=await client.space.findMany({
            where:{
                creatorID:userId
            }
        })
        if(spaces.length>0)
      {  res.status(200).json({
            spaces: spaces.map(space=>({
                spaceID:space.spaceID,
                name:space.name,
                dimensions:`${space.width}x${space.height}`,
                thumbnail:space.thumbnail
            }))
    })
return }
    }
    catch(e){

        res.status(400).json({
            "message":"No spaces found"
        })
    }
})
spaceRouter.use("/create",userMiddleware,async(req,res)=>{
    
    const parsedData=createSpaceSchema.safeParse(req.body);
    if(!(parsedData.success)){
        res.status(400).json({
            message:"Invalid Data"
        })
    }
    else{
        try{
            console.log(parsedData.data.mapID);
            if(!parsedData.data.mapID)
           {
               
            const space=await client.space.create({
               data:{
                    name:parsedData.data.name,
                    height:parseInt(parsedData.data.dimensions.split('x')[1]),
                    width:parseInt(parsedData.data.dimensions.split('x')[0]),
                    creatorID:req.userID!
               }
            })
            res.status(200).json({
                spaceID:space.spaceID
               })
               return 
            }
          
            const map=await client.map.findFirst({
                where:{
                    mapID:parsedData.data.mapID
                },
                select:{
                    mapElements:true,
                    height:true,
                    width:true
                }
            
                 
            })
            if(!map){
                res.status(403).json({
                message:"No map found" })
                    return
            }
            let space= await client.$transaction(async () =>{
                const space = await client.space.create({
                    data:{
                        name:parsedData.data.name,
                        width:map.width,
                        height:map.height,
                        creatorID:req.userID!
                    }
                });

                await client.spaceElement.createMany({
                    data: map.mapElements.map(e=>({
                        spaceID:space.spaceID,
                        elementID:e.elementID,
                        x:e.x!,
                        y:e.y!
                    }))
                })
                return space
            })

            res.status(200).json({
                spaceID:space.spaceID,
            message:"Space created from Map"
            })
            return 
            
            }
        catch(e){
            console.log(e)
            res.status(400).json({
                message:"Space creation failed"
            })

        }
    }
  
})

spaceRouter.get("/element/all",async(req,res)=>{
    

    try{
        const elements=await client.element.findMany();

        res.status(200).json({
            elements: elements.map(e=>({
                id:e.elementID,
                imageUrl:e.imageUrl,
                width:e.width,
                height:e.height,
                // static:e.static
            }))
        })
           
        }
        catch(e){
            res.status(400).json({
                message:"Error finding elements"
            })
        }


})
spaceRouter.get("/:spaceID",userMiddleware,async(req,res)=>{
    const parsedData=req.params.spaceID;
    const space_id=parsedData;
    
    try{
        const space=await client.space.findUnique({
            where:{
                spaceID:space_id
            }, include: {
                element: {
                    include: {
                        element: true
                    }
                },
            }
        })
        if(!space){
            res.status(400).json({
                message:"Invalid space id"
            })
            return
        }
        res.json({
            "dimensions": `${space.width}x${space.height}`,
            elements: space.element.map(e => ({
                id: e.id,
                element: {
                    id: e.element.elementID,
                    imageUrl: e.element.imageUrl,
                    width: e.element.width,
                    height: e.element.height,
                    // static: e.element.static
                },
                x: e.x,
                y: e.y
            })),
        })
    }
    catch(e){
        res.status(400).json({
            message:"Invalid space id"
        })
    }
})
spaceRouter.delete("/element",userMiddleware,async(req,res)=>{
    const parsedData=DeleteElementSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({
            message:"Invalid element data"
        })
        return
    }
    try{
        await client.spaceElement.delete({
            where:{
                id:parsedData.data.elementID
            }
        })
        res.status(200).json({
            message:"Element deleted"
        })
        return
    }
    catch(e){
        res.status(400).json({
            message:"Element deletion failed"
        })
        return
    }
})
spaceRouter.delete("/:spaceID",userMiddleware,async(req,res)=>{
    
    const parsedData=req.params.spaceID;
    const space_id=parsedData.slice(1,parsedData.length);


    try{
       await client.space.delete({
            where:{
                spaceID:space_id
            }
        })
        res.status(200).json({
            message:"Space deleted"
        })
    }
    catch(e){
        res.status(400).json({
            message:"Invalid space id"
        })
    }

})

spaceRouter.post("/element",userMiddleware,async(req,res)=>{
    const parsedData=AddElementSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({
            message:"Invalid element data"
        })
        return
    }
    try{
        const space=await client.space.findUnique({
            where:{
                spaceID:parsedData.data.spaceID
            }
        })
        if(!space){
            res.status(400).json({
                message:"Invalid space id"
            })
            return
        }
        if(parsedData.data.x>space.width || parsedData.data.y>space.height || parsedData.data.x<0 || parsedData.data.y<0){
            res.status(400).json({
                message:"Invalid coordinates"
            })
            return
        }
        await client.spaceElement.create({
            data:{
                elementID:parsedData.data.elementID,
                spaceID:parsedData.data.spaceID,
                x:parsedData.data.x,
                y:parsedData.data.y
            }
        })
        res.status(200).json({
            message:"Element added"
        })
        return
    }
    catch(e){
        res.status(400).json({
            message:"Element addition failed"
        })
        return
    }

})