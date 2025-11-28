-- CreateTable: DevotionalTemplate
CREATE TABLE "DevotionalTemplate" (
    "id" TEXT NOT NULL,
    "scriptureReference" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "culturalContext" TEXT NOT NULL,
    "literaryContext" TEXT NOT NULL,
    "christConnection" TEXT NOT NULL,
    "applicationQuestions" TEXT NOT NULL,
    "scriptureText" TEXT,
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "DevotionalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique scriptureReference
CREATE UNIQUE INDEX "DevotionalTemplate_scriptureReference_key" ON "DevotionalTemplate"("scriptureReference");

-- Step 1: Add templateId column as nullable first
ALTER TABLE "DevotionalSession" ADD COLUMN "templateId" TEXT;

-- Step 2: Migrate existing sessions to templates
-- For each unique scriptureReference, create a template and link sessions
INSERT INTO "DevotionalTemplate" ("id", "scriptureReference", "theme", "culturalContext", "literaryContext", "christConnection", "applicationQuestions", "scriptureText", "isAiGenerated", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "scriptureReference",
    "theme",
    "culturalContext",
    "literaryContext",
    "christConnection",
    "applicationQuestions",
    "scriptureText",
    true,
    MIN("createdAt"),
    NOW()
FROM "DevotionalSession"
GROUP BY "scriptureReference", "theme", "culturalContext", "literaryContext", "christConnection", "applicationQuestions", "scriptureText";

-- Step 3: Update sessions to reference their templates
UPDATE "DevotionalSession" ds
SET "templateId" = dt."id"
FROM "DevotionalTemplate" dt
WHERE ds."scriptureReference" = dt."scriptureReference";

-- Step 4: Make templateId NOT NULL after data migration
ALTER TABLE "DevotionalSession" ALTER COLUMN "templateId" SET NOT NULL;

-- Step 5: Drop old columns from DevotionalSession
ALTER TABLE "DevotionalSession" DROP COLUMN "scriptureReference";
ALTER TABLE "DevotionalSession" DROP COLUMN "theme";
ALTER TABLE "DevotionalSession" DROP COLUMN "culturalContext";
ALTER TABLE "DevotionalSession" DROP COLUMN "literaryContext";
ALTER TABLE "DevotionalSession" DROP COLUMN "christConnection";
ALTER TABLE "DevotionalSession" DROP COLUMN "applicationQuestions";
ALTER TABLE "DevotionalSession" DROP COLUMN "scriptureText";

-- Step 6: Add foreign key constraint
ALTER TABLE "DevotionalSession" ADD CONSTRAINT "DevotionalSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DevotionalTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Add index on templateId
CREATE INDEX "DevotionalSession_templateId_idx" ON "DevotionalSession"("templateId");

