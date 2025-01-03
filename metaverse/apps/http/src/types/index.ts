import { PassThrough } from 'stream'
import z, { object } from 'zod'

export const signUpSchema =z.object({
    username:z.string(),
    password:z.string().min(8),
    type:z.enum(["user","admin"])
})

export const signInSchema=z.object({
    username:z.string(),
    password:z.string().min(8)
})

export const updateMetadataOwn=z.object({
    avatarID:z.string()
})

export const createSpaceSchema=z.object({
   
        name: z.string(),
        dimensions: z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/),
        mapID: z.string().optional()

})
export const createElementSchema=z.object({

    imageUrl:z.string(),
    width:z.number(),
    height:z.number(),
    static:z.boolean()

})


export const AddElementSchema=z.object({

    elementID:z.string(),
    spaceID:z.string(),
    x:z.number(),
    y:z.number()

})

export const AddElementSchemaToMap=z.object({

    elementID:z.string(),
    mapID:z.string(),
    x:z.number(),
    y:z.number()

})

export const DeleteElementSchema= z.object({
    elementID:z.string()
})

export const CreateMapSchema = z.object({
    thumbnail:z.string().url(),
    dimensions:z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/),
    name: z.string(),
    defaultElements : z.array(z.object({
        elementID:z.string(),
        x: z.number(),
        y: z.number()
    })).optional()
})
export const GetMapElementSchema=z.object({
    mapID:z.string()
})

export const CreateAvatarSchema = z.object({
    imageUrl:z.string(),
    name:z.string()
})
declare global{
    namespace Express {
        export interface Request{
            role?:"Admin"|"User";
            userID?:string;
        }
    }
}