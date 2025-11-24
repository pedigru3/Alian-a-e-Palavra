/*
  Warnings:

  - Added the required column `code` to the `Couple` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Couple" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Couple" ("createdAt", "id", "updatedAt") SELECT "createdAt", "id", "updatedAt" FROM "Couple";
DROP TABLE "Couple";
ALTER TABLE "new_Couple" RENAME TO "Couple";
CREATE UNIQUE INDEX "Couple_code_key" ON "Couple"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
