-- Drop old WeeklyProgress table (user-based)
DROP TABLE IF EXISTS "WeeklyProgress";

-- Create new WeeklyProgress table (couple-based with history)
CREATE TABLE "WeeklyProgress" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "daysCompleted" TEXT NOT NULL,
    "spiritualGrowthXP" INTEGER NOT NULL,
    "coupleId" TEXT NOT NULL,

    CONSTRAINT "WeeklyProgress_pkey" PRIMARY KEY ("id")
);

-- Create unique index for couple + weekStart
CREATE UNIQUE INDEX "WeeklyProgress_coupleId_weekStart_key" ON "WeeklyProgress"("coupleId", "weekStart");

-- Add foreign key constraint
ALTER TABLE "WeeklyProgress" ADD CONSTRAINT "WeeklyProgress_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

