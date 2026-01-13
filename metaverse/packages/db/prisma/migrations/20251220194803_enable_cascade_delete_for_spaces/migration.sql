-- DropForeignKey
ALTER TABLE "SpaceElement" DROP CONSTRAINT "SpaceElement_spaceID_fkey";

-- AddForeignKey
ALTER TABLE "SpaceElement" ADD CONSTRAINT "SpaceElement_spaceID_fkey" FOREIGN KEY ("spaceID") REFERENCES "Space"("spaceID") ON DELETE CASCADE ON UPDATE CASCADE;
