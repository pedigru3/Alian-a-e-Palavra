-- DropForeignKey
ALTER TABLE "DevotionalSession" DROP CONSTRAINT "DevotionalSession_coupleId_fkey";

-- DropForeignKey
ALTER TABLE "DevotionalSession" DROP CONSTRAINT "DevotionalSession_initiatedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_userId_fkey";

-- AlterTable
ALTER TABLE "DevotionalSession" ALTER COLUMN "date" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "DevotionalSessionUserProgress" ALTER COLUMN "completedAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "Note" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AddForeignKey
ALTER TABLE "DevotionalSession" ADD CONSTRAINT "DevotionalSession_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevotionalSession" ADD CONSTRAINT "DevotionalSession_initiatedByUserId_fkey" FOREIGN KEY ("initiatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DevotionalSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
