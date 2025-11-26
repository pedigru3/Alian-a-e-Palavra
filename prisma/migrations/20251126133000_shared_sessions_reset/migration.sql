-- Drop old devotional tables
DROP TABLE IF EXISTS "DevotionalSessionUserProgress" CASCADE;
DROP TABLE IF EXISTS "Note" CASCADE;
DROP TABLE IF EXISTS "DevotionalSession" CASCADE;

-- Recreate DevotionalSession with couple-level ownership
CREATE TABLE "DevotionalSession" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scriptureReference" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "culturalContext" TEXT NOT NULL,
    "literaryContext" TEXT NOT NULL,
    "christConnection" TEXT NOT NULL,
    "applicationQuestions" TEXT NOT NULL,
    "scriptureText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "coupleId" TEXT NOT NULL,
    "initiatedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "DevotionalSession_pkey" PRIMARY KEY ("id")
);

-- Table to track per-user progress within a shared devotional session
CREATE TABLE "DevotionalSessionUserProgress" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "completedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "DevotionalSessionUserProgress_pkey" PRIMARY KEY ("id")
);

-- Notes now reference the shared session
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "DevotionalSession_coupleId_date_idx" ON "DevotionalSession"("coupleId", "date");
CREATE UNIQUE INDEX "DevotionalSessionUserProgress_sessionId_userId_key" ON "DevotionalSessionUserProgress"("sessionId", "userId");
CREATE INDEX "DevotionalSessionUserProgress_sessionId_idx" ON "DevotionalSessionUserProgress"("sessionId");
CREATE INDEX "DevotionalSessionUserProgress_userId_idx" ON "DevotionalSessionUserProgress"("userId");

-- Foreign keys
ALTER TABLE "DevotionalSession"
    ADD CONSTRAINT "DevotionalSession_coupleId_fkey"
        FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DevotionalSession"
    ADD CONSTRAINT "DevotionalSession_initiatedByUserId_fkey"
        FOREIGN KEY ("initiatedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DevotionalSessionUserProgress"
    ADD CONSTRAINT "DevotionalSessionUserProgress_sessionId_fkey"
        FOREIGN KEY ("sessionId") REFERENCES "DevotionalSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DevotionalSessionUserProgress"
    ADD CONSTRAINT "DevotionalSessionUserProgress_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note"
    ADD CONSTRAINT "Note_sessionId_fkey"
        FOREIGN KEY ("sessionId") REFERENCES "DevotionalSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Note"
    ADD CONSTRAINT "Note_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

