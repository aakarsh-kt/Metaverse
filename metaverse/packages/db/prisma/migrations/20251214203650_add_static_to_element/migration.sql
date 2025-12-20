-- AlterTable
ALTER TABLE "Element" ADD COLUMN     "static" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "_SavedSpaces" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SavedSpaces_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SavedSpaces_B_index" ON "_SavedSpaces"("B");

-- AddForeignKey
ALTER TABLE "_SavedSpaces" ADD CONSTRAINT "_SavedSpaces_A_fkey" FOREIGN KEY ("A") REFERENCES "Space"("spaceID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SavedSpaces" ADD CONSTRAINT "_SavedSpaces_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
