-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatarID" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Space" (
    "spaceID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creatorID" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "thumbnail" TEXT,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("spaceID")
);

-- CreateTable
CREATE TABLE "SpaceElement" (
    "id" TEXT NOT NULL,
    "elementID" TEXT NOT NULL,
    "spaceID" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,

    CONSTRAINT "SpaceElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avatar" (
    "avatarID" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Avatar_pkey" PRIMARY KEY ("avatarID")
);

-- CreateTable
CREATE TABLE "Element" (
    "elementID" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "Element_pkey" PRIMARY KEY ("elementID")
);

-- CreateTable
CREATE TABLE "Map" (
    "mapID" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Map_pkey" PRIMARY KEY ("mapID")
);

-- CreateTable
CREATE TABLE "MapElements" (
    "id" TEXT NOT NULL,
    "mapID" TEXT NOT NULL,
    "elementID" TEXT NOT NULL,
    "x" INTEGER,
    "y" INTEGER,

    CONSTRAINT "MapElements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Space_spaceID_key" ON "Space"("spaceID");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceElement_id_key" ON "SpaceElement"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Avatar_avatarID_key" ON "Avatar"("avatarID");

-- CreateIndex
CREATE UNIQUE INDEX "Element_elementID_key" ON "Element"("elementID");

-- CreateIndex
CREATE UNIQUE INDEX "Map_mapID_key" ON "Map"("mapID");

-- CreateIndex
CREATE UNIQUE INDEX "MapElements_id_key" ON "MapElements"("id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarID_fkey" FOREIGN KEY ("avatarID") REFERENCES "Avatar"("avatarID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_creatorID_fkey" FOREIGN KEY ("creatorID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceElement" ADD CONSTRAINT "SpaceElement_spaceID_fkey" FOREIGN KEY ("spaceID") REFERENCES "Space"("spaceID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceElement" ADD CONSTRAINT "SpaceElement_elementID_fkey" FOREIGN KEY ("elementID") REFERENCES "Element"("elementID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapElements" ADD CONSTRAINT "MapElements_mapID_fkey" FOREIGN KEY ("mapID") REFERENCES "Map"("mapID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapElements" ADD CONSTRAINT "MapElements_elementID_fkey" FOREIGN KEY ("elementID") REFERENCES "Element"("elementID") ON DELETE RESTRICT ON UPDATE CASCADE;
