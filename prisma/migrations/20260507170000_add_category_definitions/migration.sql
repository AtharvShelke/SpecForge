CREATE TABLE "CategoryDefinition" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "shortLabel" TEXT,
  "description" TEXT,
  "icon" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "featuredOrder" INTEGER,
  "buildOrder" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "showInFeatured" BOOLEAN NOT NULL DEFAULT false,
  "showInBuilds" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CategoryDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CategoryRelationship" (
  "id" TEXT NOT NULL,
  "fromCategoryCode" TEXT,
  "toCategoryCode" TEXT,
  "relationshipType" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CategoryRelationship_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CategoryDefinition_code_key" ON "CategoryDefinition"("code");
CREATE INDEX "CategoryDefinition_isActive_displayOrder_idx" ON "CategoryDefinition"("isActive", "displayOrder");
CREATE INDEX "CategoryDefinition_showInBuilds_buildOrder_idx" ON "CategoryDefinition"("showInBuilds", "buildOrder");
CREATE INDEX "CategoryDefinition_showInFeatured_featuredOrder_idx" ON "CategoryDefinition"("showInFeatured", "featuredOrder");

CREATE INDEX "CategoryRelationship_relationshipType_sortOrder_idx" ON "CategoryRelationship"("relationshipType", "sortOrder");
CREATE INDEX "CategoryRelationship_fromCategoryCode_idx" ON "CategoryRelationship"("fromCategoryCode");
CREATE INDEX "CategoryRelationship_toCategoryCode_idx" ON "CategoryRelationship"("toCategoryCode");
