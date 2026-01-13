import { Router } from "express";
import client from "@repo/db/client"
import { AddElementSchema, createSpaceSchema, DeleteElementSchema } from "../../types";

import { userMiddleware } from "../../middleware/user";

export const spaceRouter = Router();

spaceRouter.get("/all", userMiddleware, async (req, res) => {
    const userId = req.userID;
    try {
        const ownedSpaces = await client.space.findMany({
            where: { creatorID: userId }
        });
        const userWithSavedSpaces = await client.user.findUnique({
            where: { id: userId },
            include: { savedSpaces: true }
        });

        res.status(200).json({
            owned: ownedSpaces.map(space => ({
                spaceID: space.spaceID,
                name: space.name,
                dimensions: `${space.width}x${space.height}`,
                thumbnail: space.thumbnail
            })),
            saved: userWithSavedSpaces?.savedSpaces.map(space => ({
                spaceID: space.spaceID,
                name: space.name,
                dimensions: `${space.width}x${space.height}`,
                thumbnail: space.thumbnail
            })) || []
        });
    } catch (e) {
        res.status(400).json({ message: "No spaces found" });
    }
})
spaceRouter.use("/create", userMiddleware, async (req, res) => {

    const parsedData = createSpaceSchema.safeParse(req.body);
    if (!(parsedData.success)) {
        res.status(400).json({
            message: "Invalid Data"
        })
    }
    else {
        try {

            if (!parsedData.data.mapID) {

                const defaultThumbnails = [
                    "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800", // Abstract tech
                    "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=800", // Purple/Cyan gradient
                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800", // Abstract mesh
                    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800"  // Cyberpunk aesthetic
                ];
                const randomThumb = defaultThumbnails[Math.floor(Math.random() * defaultThumbnails.length)];

                const space = await client.space.create({
                    data: {
                        name: parsedData.data.name,
                        height: parseInt(parsedData.data.dimensions.split('x')[1]),
                        width: parseInt(parsedData.data.dimensions.split('x')[0]),
                        creatorID: req.userID!,
                        thumbnail: randomThumb
                    }
                })
                res.status(200).json({
                    spaceID: space.spaceID
                })
                return
            }

            const map = await client.map.findFirst({
                where: {
                    mapID: parsedData.data.mapID
                },
                select: {
                    mapElements: true,
                    height: true,
                    width: true,
                    thumbnail: true
                }


            })
            if (!map) {
                res.status(403).json({
                    message: "No map found"
                })
                return
            }
            let space = await client.$transaction(async () => {
                const space = await client.space.create({
                    data: {
                        name: parsedData.data.name,
                        width: map.width,
                        height: map.height,
                        creatorID: req.userID!,
                        thumbnail: map.thumbnail
                    }
                });

                // Fetch element templates to get their default 'static' status
                const elementIDs = map.mapElements.map(e => e.elementID);
                const elementTemplates = await client.element.findMany({
                    where: { elementID: { in: elementIDs } }
                });
                const staticMap = new Map(elementTemplates.map(el => [el.elementID, el.static]));

                await client.spaceElement.createMany({
                    data: map.mapElements.map(e => ({
                        spaceID: space.spaceID,
                        elementID: e.elementID,
                        x: e.x!,
                        y: e.y!,
                        static: staticMap.get(e.elementID) ?? false
                    }))
                })
                return space
            })

            res.status(200).json({
                spaceID: space.spaceID,
                message: "Space created from Map"
            })
            return

        }
        catch (e) {
            console.log(e)
            res.status(400).json({
                message: "Space creation failed"
            })

        }
    }

})

// === Saved Spaces Endpoints ===

spaceRouter.post("/join", userMiddleware, async (req, res) => {
    const { spaceID } = req.body;
    if (!spaceID) {
        res.status(400).json({ message: "Space ID is required" });
        return;
    }

    try {
        const space = await client.space.findUnique({
            where: { spaceID: spaceID }
        });
        if (!space) {
            res.status(404).json({ message: "Space not found" });
            return;
        }

        // Check if already in collection to avoid redundant operations (though Prisma handles it)
        const user = await client.user.findUnique({
            where: { id: req.userID },
            select: { savedSpaces: { where: { spaceID: spaceID } } }
        });

        if (user?.savedSpaces.length) {
            res.status(400).json({ message: "Space already in collection" });
            return;
        }

        await client.user.update({
            where: { id: req.userID },
            data: {
                savedSpaces: {
                    connect: { spaceID: spaceID }
                }
            }
        });
        res.status(200).json({ message: "Space joined" });
    } catch (e) {
        console.error("Join error:", e);
        res.status(500).json({ message: "Internal server error during join" });
    }
});

spaceRouter.delete("/join", userMiddleware, async (req, res) => {
    const { spaceID } = req.body;
    try {
        await client.user.update({
            where: { id: req.userID },
            data: {
                savedSpaces: {
                    disconnect: { spaceID: spaceID }
                }
            }
        });
        res.status(200).json({ message: "Space removed" });
    } catch (e) {
        res.status(400).json({ message: "Removal failed" });
    }
});
spaceRouter.get("/element/all", async (req, res) => {


    try {
        const elements = await client.element.findMany();

        res.status(200).json({
            elements: elements.map(e => ({
                id: e.elementID,
                imageUrl: e.imageUrl,
                width: e.width,
                height: e.height,
                static: (e as any)["static"]
            }))
        })

    }
    catch (e) {
        res.status(400).json({
            message: "Error finding elements"
        })
    }


})
spaceRouter.get("/:spaceID", userMiddleware, async (req, res) => {
    const parsedData = req.params.spaceID;
    const space_id = parsedData;

    try {
        const space = await client.space.findUnique({
            where: {
                spaceID: space_id
            }, include: {
                element: {
                    include: {
                        element: true
                    }
                },
            }
        })
        if (!space) {
            res.status(400).json({
                message: "Invalid space id"
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
                    static: e.static // Use localized physics
                },
                x: e.x,
                y: e.y
            })),
        })
    }
    catch (e) {
        res.status(400).json({
            message: "Invalid space id"
        })
    }
})
spaceRouter.delete("/element", userMiddleware, async (req, res) => {
    // Some clients historically sent `{ id }` instead of `{ elementID }`.
    const normalizedBody = (req.body && typeof req.body === "object")
        ? ({
            elementID: (req.body as any).elementID ?? (req.body as any).id,
        })
        : req.body;

    const parsedData = DeleteElementSchema.safeParse(normalizedBody);
    if (!parsedData.success) {
        res.status(400).json({
            message: "Invalid element data"
        })
        return
    }
    try {
        // Only the creator of the space can modify its elements.
        const existing = await client.spaceElement.findUnique({
            where: { id: parsedData.data.elementID },
            select: { id: true, space: { select: { creatorID: true } } },
        });
        if (!existing) {
            res.status(404).json({ message: "Element not found" });
            return;
        }
        if (existing.space.creatorID !== req.userID) {
            res.status(403).json({ message: "Not allowed" });
            return;
        }

        await client.spaceElement.delete({
            where: {
                id: parsedData.data.elementID
            }
        })
        res.status(200).json({
            message: "Element deleted"
        })
        return
    }
    catch (e) {
        res.status(400).json({
            message: "Element deletion failed"
        })
        return
    }
})
spaceRouter.delete("/:spaceID", userMiddleware, async (req, res) => {
    const space_id = req.params.spaceID;

    try {
        const space = await client.space.findUnique({
            where: { spaceID: space_id },
            select: { creatorID: true }
        });

        if (!space) {
            res.status(404).json({ message: "Space not found" });
            return;
        }

        if (space.creatorID !== req.userID) {
            res.status(403).json({ message: "You are not authorized to delete this space" });
            return;
        }

        await client.space.delete({
            where: { spaceID: space_id }
        });

        res.status(200).json({
            message: "Space deleted"
        });
    }
    catch (e) {
        console.error("Delete error:", e);
        res.status(500).json({
            message: "Internal server error during deletion"
        });
    }
});

spaceRouter.post("/element", userMiddleware, async (req, res) => {
    const parsedData = AddElementSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({
            message: "Invalid element data"
        })
        return
    }
    try {
        const space = await client.space.findUnique({
            where: {
                spaceID: parsedData.data.spaceID
            }
        })
        if (!space) {
            res.status(400).json({
                message: "Invalid space id"
            })
            return
        }
        if (parsedData.data.x > space.width || parsedData.data.y > space.height || parsedData.data.x < 0 || parsedData.data.y < 0) {
            res.status(400).json({
                message: "Invalid coordinates"
            })
            return
        }
        const elementTemplate = await client.element.findUnique({
            where: { elementID: parsedData.data.elementID }
        });

        await client.spaceElement.create({
            data: {
                elementID: parsedData.data.elementID,
                spaceID: parsedData.data.spaceID,
                x: parsedData.data.x,
                y: parsedData.data.y,
                static: elementTemplate?.static ?? false // Copy default physics
            }
        })
        res.status(200).json({
            message: "Element added"
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

// Toggle collision/walkable for a placed element in a space.
// This updates the underlying Element.static flag (shared across all usages of that elementID).
// Contract: { spaceElementID: string, static: boolean }
spaceRouter.put("/element/static", userMiddleware, async (req, res) => {
    const body = req.body as any;
    const spaceElementID = body?.spaceElementID;
    const isStatic = body?.static;
    if (typeof spaceElementID !== "string" || typeof isStatic !== "boolean") {
        res.status(400).json({ message: "Invalid data" });
        return;
    }

    try {
        const se = await client.spaceElement.findUnique({
            where: { id: spaceElementID },
            select: { id: true, elementID: true, space: { select: { creatorID: true } } },
        });
        if (!se) {
            res.status(404).json({ message: "Element not found" });
            return;
        }
        if (se.space.creatorID !== req.userID) {
            res.status(403).json({ message: "Not allowed" });
            return;
        }

        await client.spaceElement.update({
            where: { id: spaceElementID },
            data: { static: isStatic },
        });

        res.status(200).json({ message: "Updated" });
    } catch (e) {
        res.status(400).json({ message: "Update failed" });
    }
});