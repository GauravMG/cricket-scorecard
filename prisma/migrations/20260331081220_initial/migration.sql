-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "cricbuzzMatchId" TEXT NOT NULL,
    "name" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_cricbuzzMatchId_key" ON "Match"("cricbuzzMatchId");
