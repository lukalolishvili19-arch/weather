-- AlterTable
ALTER TABLE "search_history" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "search_history" ADD COLUMN "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "search_history_userId_query_idx" ON "search_history"("userId", "query");
