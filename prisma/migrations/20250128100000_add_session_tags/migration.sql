-- CreateTable
CREATE TABLE "session_tags" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "taggedUserId" TEXT NOT NULL,
    "taggedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_tags_sessionId_taggedUserId_key" ON "session_tags"("sessionId", "taggedUserId");

-- CreateIndex
CREATE INDEX "session_tags_sessionId_idx" ON "session_tags"("sessionId");

-- CreateIndex
CREATE INDEX "session_tags_taggedUserId_idx" ON "session_tags"("taggedUserId");

-- AddForeignKey
ALTER TABLE "session_tags" ADD CONSTRAINT "session_tags_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
