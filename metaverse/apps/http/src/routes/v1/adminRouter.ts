import { Router } from "express";
import { adminMiddleware } from "../../middleware/admin";
export const adminRouter = Router();
import { AddElementSchema, AddElementSchemaToMap, CreateAvatarSchema, createElementSchema, CreateMapSchema, GetMapElementSchema, UpdateElementSchema, UpdateMapSchema } from "../../types";
import client from "@repo/db/client"
import { error } from "console";




adminRouter.post("/avatar", adminMiddleware, async (req, res) => {

    const parsedData = CreateAvatarSchema.safeParse(req.body);

    if (!parsedData.success) {
        res.status(400).json({
            message: "Validation failed"
        })
        return
    }
    try {
        const avatar = await client.avatar.create({
            data: {
                name: parsedData.data.name,
                url: parsedData.data.imageUrl,
            }

        })

        res.status(200).json({
            avatarID: avatar.avatarID
        })
        // return 
    }
    catch (e) {

        res.status(400).json({
            message: "Avatar Creation failed"
        })
        return
    }


})

adminRouter.post("/element", adminMiddleware, async (req, res) => {
    const parsedData = createElementSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({
            message: "Invalid element data"
        })
        return
    }
    try {
        const element = await client.element.create({
            data: {
                height: (parsedData.data.height),
                width: (parsedData.data.width),
                imageUrl: parsedData.data?.imageUrl,
                static: parsedData.data.static,

            }
        })

        res.status(200).json({
            elementID: element.elementID
        })
        return
    }
    catch (e) {
        res.status(400).json({
            message: "Element creation failed"
        })
        return
    }
})
adminRouter.post("/map", adminMiddleware, async (req, res) => {

    const parsedData = CreateMapSchema.safeParse(req.body);
    if (!parsedData.success) {

        res.status(400).json({
            message: "Invalid data",
            error: parsedData.error
        })
        return
    }
    try {
        const map = await client.map.create({
            data: {
                name: parsedData.data.name,
                thumbnail: parsedData.data.thumbnail,
                width: parseInt(parsedData.data.dimensions.split('x')[0]),
                height: parseInt(parsedData.data.dimensions.split('x')[1]),
                mapElements: {
                    create: parsedData.data.defaultElements?.map((e) => ({
                        elementID: e.elementID,
                        x: e.x, // Ensure x is a number
                        y: e.y, // Ensure y is a number
                    })),
                },
            }
        })

        if (!map) {
            res.status(400).json({
                message: "Map creation failed"
            })
            return
        }
        res.status(200).json({
            mapID: map.mapID
        })

    }
    catch (e) {
        res.status(400).json({
            message: "Invalid data to create a map",
            error: e
        })
    }

})

adminRouter.post("/map/element", adminMiddleware, async (req, res) => {
    const parsedData = AddElementSchemaToMap.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({
            message: "Invalid element data",
            error: parsedData.error
        })
        return
    }
    try {
        const element = await client.element.findUnique({
            where: {
                elementID: parsedData.data.elementID
            }
        })
        const map = await client.map.findFirst({
            where: {
                mapID: req.body.mapID
            }
        })
        if (!map) {
            res.status(400).json({
                message: "Invalid map id"
            })
            return
        }
        if (!element) {
            res.status(400).json({
                message: "Invalid element id"
            })
            return
        }
        await client.mapElements.create({
            data: {
                elementID: element.elementID,
                mapID: map.mapID,
                x: parsedData.data.x,
                y: parsedData.data.y
            }
        })
        res.status(200).json({
            message: "Element added to map"
        })
        return
    }
    catch (e) {
        res.status(400).json({
            message: "Element addition failed"
        })
        return
    }
})
adminRouter.get("/map", adminMiddleware, async (req, res) => {
    const parsedData = req.query.mapID;
    if (!parsedData || typeof parsedData !== "string") {
        res.status(400).json({
            message: "No map id specified"
        })
        return
    }
    try {
        const map = await client.map.findUnique({
            where: {
                mapID: parsedData
            }
        })
        if (!map) {
            res.status(400).json({
                message: "Invalid map id"
            })
            return
        }
        res.status(200).json({
            mapID: map.mapID,
            name: map.name,
            width: map.width,
            height: map.height,
            thumbnail: map.thumbnail
        })
    }
    catch (e) {
        res.status(400).json({
            message: "Invalid map id"
        })
        return
    }
})

adminRouter.get("/elements", adminMiddleware, async (req, res) => {
    try {
        const elements = await client.element.findMany();
        res.status(200).json({ elements });
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch elements" });
    }
});

adminRouter.put("/element/:elementID", adminMiddleware, async (req, res) => {
    const parsedData = UpdateElementSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Invalid update data" });
        return;
    }
    try {
        await client.element.update({
            where: { elementID: req.params.elementID },
            data: parsedData.data
        });
        res.status(200).json({ message: "Element updated" });
    } catch (e) {
        res.status(400).json({ message: "Update failed" });
    }
});

adminRouter.delete("/element/:elementID", adminMiddleware, async (req, res) => {
    try {
        await client.element.delete({
            where: { elementID: req.params.elementID }
        });
        res.status(200).json({ message: "Element deleted" });
    } catch (e) {
        res.status(400).json({ message: "Delete failed" });
    }
});

adminRouter.get("/maps", adminMiddleware, async (req, res) => {
    try {
        const maps = await client.map.findMany();
        res.status(200).json({
            maps: maps.map(m => ({
                mapID: m.mapID,
                name: m.name,
                thumbnail: m.thumbnail,
                width: m.width,
                height: m.height
            }))
        });
    } catch (e) {
        res.status(500).json({ message: "Failed to fetch maps" });
    }
});

adminRouter.put("/map/:mapID", adminMiddleware, async (req, res) => {
    const parsedData = UpdateMapSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Invalid update data" });
        return;
    }
    try {
        const { dimensions, defaultElements, ...rest } = parsedData.data;
        const updateData: any = { ...rest };

        if (dimensions) {
            updateData.width = parseInt(dimensions.split('x')[0]);
            updateData.height = parseInt(dimensions.split('x')[1]);
        }

        if (defaultElements) {
            await client.mapElements.deleteMany({ where: { mapID: req.params.mapID } });
            updateData.mapElements = {
                create: defaultElements.map(e => ({
                    elementID: e.elementID,
                    x: e.x,
                    y: e.y
                }))
            };
        }

        await client.map.update({
            where: { mapID: req.params.mapID },
            data: updateData
        });
        res.status(200).json({ message: "Map updated" });
    } catch (e) {
        console.error(e);
        res.status(400).json({ message: "Update failed" });
    }
});

adminRouter.delete("/map/:mapID", adminMiddleware, async (req, res) => {
    try {
        await client.map.delete({
            where: { mapID: req.params.mapID }
        });
        res.status(200).json({ message: "Map deleted" });
    } catch (e) {
        res.status(400).json({ message: "Delete failed" });
    }
});
adminRouter.post("/map/getElement", adminMiddleware, async (req, res) => {
    const parsedData = GetMapElementSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({
            message: "No map id specified"
        })
        return
    }
    try {
        const map = await client.map.findUnique({
            where: {
                mapID: parsedData.data.mapID
            }
        })
        if (!map) {
            res.status(400).json({
                message: "Invalid map id"
            })
            return
        }
        const elements = await client.mapElements.findMany({
            where: {
                mapID: parsedData.data.mapID
            }
        })
        const imageUrls = await Promise.all(elements.map(async e => {
            const element = await client.element.findUnique({
                where: {
                    elementID: e.elementID
                },
                select: {
                    imageUrl: true
                }
            })

            const newElement = {
                elementID: e.elementID,
                x: e.x,
                y: e.y,
                imageUrl: element?.imageUrl

            }
            return newElement;
        }))
        res.status(200).json({
            elements: imageUrls.map(e => ({
                elementID: e.elementID,
                x: e.x,
                y: e.y,
                imageUrl: e.imageUrl
            }))
        })
        return
    }
    catch (e) {
        res.status(400).json({
            message: "Invalid map id"
        })
        return
    }
})