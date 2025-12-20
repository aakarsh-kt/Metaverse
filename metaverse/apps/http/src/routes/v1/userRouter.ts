import { Router } from "express";
import { updateMetadataOwn } from "../../types";
import client from "@repo/db/client"
import { userMiddleware } from "../../middleware/user";

export const userRouter = Router();

userRouter.get("/metadata", userMiddleware, async (req, res) => {
    try {
        const user = await client.user.findUnique({
            where: { id: req.userID },
            select: { id: true, username: true, avatarID: true },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({
            userID: user.id,
            username: user.username,
            avatarID: user.avatarID,
        });
    } catch (e) {
        res.status(400).json({ message: "Failed" });
    }
});

userRouter.post("/metadata", userMiddleware, async (req, res) => {
    // console.log("123",req.params);
    const parsedData = updateMetadataOwn.safeParse(req.body);
    if (!(parsedData.success)) {
        res.status(400).json({
            "message": "Failed"
        })
        return
    }
    try {
        await client.user.update({
            where:
            {
                id: req.userID
            },
            data: {
                ...(typeof parsedData.data.avatarID === "string" ? { avatarID: parsedData.data.avatarID } : {}),
                ...(typeof parsedData.data.username === "string" ? { username: parsedData.data.username } : {}),
            }
        })
        res.status(200).json({
            message: "Meta data Updated"
        })

    }
    catch (e) {
        // Could be avatar FK mismatch or username uniqueness violation.
        const msg = (e && typeof e === "object" && "code" in (e as any) && (e as any).code === "P2002")
            ? "Username already taken"
            : "Failed to update metadata";

        res.status(400).json({ message: msg })
    }
})

userRouter.get("/metadata/bulk", async (req, res) => {

    const ids = req.query.ids;

    const idsArray: string[] = typeof ids == "string" ? ids.split(',') : [""] // Convert comma-separated string to array



    if (!ids) {
        res.status(400).json({
            message: "No ids specified"
        });
    }
    else {
        try {
            const results = await client.user.findMany({
                where: {
                    id: {
                        in: idsArray,
                    },

                },
                select: {
                    id: true,
                    username: true,
                    avatar: true

                }

            })
            res.status(200).json({
                avatars: results.map(m => ({
                    userID: m.id,
                    username: m.username,
                    avatarID: m.avatar?.avatarID,
                    avatarUrl: m.avatar?.url
                }))
            })
        }
        catch (e) {
            res.json({
                message: "Failed to find relevant avatars"
            })
        }
    }

})

userRouter.get("/maps", userMiddleware, async (req, res) => {
    const userId = req.userID;

    try {
        const maps = await client.map.findMany();
        if (maps.length > 0) {
            res.status(200).json({
                mapIDs: maps.map(map => ({
                    mapID: map.mapID,
                    name: map.name,
                    width: map.width,
                    height: map.height,
                    thumbnail: map.thumbnail
                }))
            })
        }
    }
    catch (e) {

        res.status(400).json({
            "message": "No maps found"
        })
    }
})
