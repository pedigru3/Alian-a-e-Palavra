-- DropForeignKey
ALTER TABLE "DevotionalSession" DROP CONSTRAINT "DevotionalSession_coupleId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "WeeklyProgress" DROP CONSTRAINT "WeeklyProgress_coupleId_fkey";

-- AddForeignKey
ALTER TABLE "DevotionalSession" ADD CONSTRAINT "DevotionalSession_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DevotionalSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyProgress" ADD CONSTRAINT "WeeklyProgress_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;
