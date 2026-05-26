CREATE TABLE "BuildSequence" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildSequence_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CategoryHierarchy" ADD COLUMN "category_definition_id" TEXT;
ALTER TABLE "CategorySchema" ADD COLUMN "category_definition_id" TEXT;
ALTER TABLE "CategoryFilterConfig" ADD COLUMN "category_definition_id" TEXT;

INSERT INTO "BuildSequence" ("id", "categoryId", "stepOrder", "createdAt", "updatedAt")
SELECT
    'bs_' || md5(cd."id" || ':' || cd."buildOrder"::text),
    cd."id",
    cd."buildOrder",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "CategoryDefinition" cd
WHERE cd."buildOrder" IS NOT NULL;

UPDATE "CategoryHierarchy" ch
SET "category_definition_id" = cd."id"
FROM "categories" c
JOIN "CategoryDefinition" cd ON lower(cd."label") = lower(c."name")
WHERE ch."category_id" = c."id";

UPDATE "CategorySchema" cs
SET "category_definition_id" = cd."id"
FROM "categories" c
JOIN "CategoryDefinition" cd ON lower(cd."label") = lower(c."name")
WHERE cs."category_id" = c."id";

UPDATE "CategoryFilterConfig" cfc
SET "category_definition_id" = cd."id"
FROM "categories" c
JOIN "CategoryDefinition" cd ON lower(cd."label") = lower(c."name")
WHERE cfc."category_id" = c."id";

DELETE FROM "CategoryHierarchy"
WHERE "category_id" IS NOT NULL
  AND "category_definition_id" IS NULL;

DELETE FROM "CategorySchema"
WHERE "category_definition_id" IS NULL;

DELETE FROM "CategoryFilterConfig"
WHERE "category_definition_id" IS NULL;

ALTER TABLE "CategoryHierarchy" DROP CONSTRAINT IF EXISTS "CategoryHierarchy_category_id_fkey";
ALTER TABLE "CategorySchema" DROP CONSTRAINT IF EXISTS "CategorySchema_category_id_fkey";
ALTER TABLE "CategoryFilterConfig" DROP CONSTRAINT IF EXISTS "CategoryFilterConfig_category_id_fkey";

DROP INDEX IF EXISTS "CategoryHierarchy_categoryId_idx";
DROP INDEX IF EXISTS "CategoryDefinition_showInBuilds_buildOrder_idx";
DROP INDEX IF EXISTS "CategorySchema_category_id_key";
DROP INDEX IF EXISTS "CategoryFilterConfig_category_id_key";
DROP INDEX IF EXISTS "CategoryFilterConfig_categoryId_idx";

ALTER TABLE "CategoryHierarchy" DROP COLUMN "category_id";
ALTER TABLE "CategorySchema" DROP COLUMN "category_id";
ALTER TABLE "CategoryFilterConfig" DROP COLUMN "category_id";
ALTER TABLE "CategoryDefinition" DROP COLUMN "buildOrder";
ALTER TABLE "CategoryDefinition" DROP COLUMN "showInBuilds";

ALTER TABLE "CategorySchema" ALTER COLUMN "category_definition_id" SET NOT NULL;
ALTER TABLE "CategoryFilterConfig" ALTER COLUMN "category_definition_id" SET NOT NULL;

CREATE UNIQUE INDEX "BuildSequence_categoryId_key" ON "BuildSequence"("categoryId");
CREATE UNIQUE INDEX "BuildSequence_stepOrder_key" ON "BuildSequence"("stepOrder");
CREATE INDEX "BuildSequence_stepOrder_idx" ON "BuildSequence"("stepOrder");
CREATE UNIQUE INDEX "CategorySchema_category_definition_id_key" ON "CategorySchema"("category_definition_id");
CREATE UNIQUE INDEX "CategoryFilterConfig_category_definition_id_key" ON "CategoryFilterConfig"("category_definition_id");
CREATE INDEX "CategoryFilterConfig_categoryDefinitionId_idx" ON "CategoryFilterConfig"("category_definition_id");
CREATE INDEX "CategoryHierarchy_categoryDefinitionId_idx" ON "CategoryHierarchy"("category_definition_id");

ALTER TABLE "BuildSequence"
ADD CONSTRAINT "BuildSequence_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "CategoryDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CategoryHierarchy"
ADD CONSTRAINT "CategoryHierarchy_category_definition_id_fkey"
FOREIGN KEY ("category_definition_id") REFERENCES "CategoryDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CategorySchema"
ADD CONSTRAINT "CategorySchema_category_definition_id_fkey"
FOREIGN KEY ("category_definition_id") REFERENCES "CategoryDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CategoryFilterConfig"
ADD CONSTRAINT "CategoryFilterConfig_category_definition_id_fkey"
FOREIGN KEY ("category_definition_id") REFERENCES "CategoryDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
