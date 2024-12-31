-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_avatarID_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "avatarID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarID_fkey" FOREIGN KEY ("avatarID") REFERENCES "Avatar"("avatarID") ON DELETE SET NULL ON UPDATE CASCADE;
