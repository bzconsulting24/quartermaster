-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "EmbeddingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable Document - Add embedding tracking fields
ALTER TABLE "Document" ADD COLUMN "embeddingStatus" "EmbeddingStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Document" ADD COLUMN "chunkCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Document" ADD COLUMN "embeddedAt" TIMESTAMP(3);

-- CreateTable DocumentChunk
CREATE TABLE "DocumentChunk" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" INTEGER,
    "accountId" INTEGER,
    "opportunityId" INTEGER,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");

-- CreateIndex
CREATE INDEX "DocumentChunk_accountId_idx" ON "DocumentChunk"("accountId");

-- CreateIndex
CREATE INDEX "DocumentChunk_opportunityId_idx" ON "DocumentChunk"("opportunityId");

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create vector similarity index using cosine distance (good for normalized embeddings)
CREATE INDEX "DocumentChunk_embedding_idx" ON "DocumentChunk" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Alternative: L2 distance index (uncomment if preferred)
-- CREATE INDEX "DocumentChunk_embedding_l2_idx" ON "DocumentChunk" USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
