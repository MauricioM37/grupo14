-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PROCESSING', 'READY_FOR_REVIEW', 'PUBLISHED', 'FAILED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('PENDING', 'USABLE', 'FAILED');

-- CreateEnum
CREATE TYPE "SummaryStatus" AS ENUM ('GENERATED', 'APPROVED', 'FAILED');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED', 'OPTED_OUT');

-- CreateEnum
CREATE TYPE "ConsentEventType" AS ENUM ('OPT_IN', 'REVOCATION');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "numberCiphertext" TEXT NOT NULL,
    "numberIv" TEXT NOT NULL,
    "numberAuthTag" TEXT NOT NULL,
    "numberDigest" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentEvent" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "type" "ConsentEventType" NOT NULL,
    "selectedCategorySlugs" JSONB NOT NULL,
    "consentTextVersion" TEXT NOT NULL,
    "consentText" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceDate" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fingerprint" TEXT,
    "extractedText" TEXT,
    "extractedChars" INTEGER NOT NULL DEFAULT 0,
    "status" "SourceStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Summary" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceFingerprint" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "modelConfiguration" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" "SummaryStatus" NOT NULL DEFAULT 'GENERATED',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'DRAFT',
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "disclaimer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudienceSnapshot" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "matchedSlugs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudienceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRecipient" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationState" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "consultationId" TEXT,
    "projectId" TEXT,
    "activeUntil" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'awaiting_option',
    "lastInboundKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opinion" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "optionLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opinion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpinionEvent" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpinionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateResult" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "counts" JSONB NOT NULL,
    "percentages" JSONB NOT NULL,
    "participantCount" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AggregateResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_numberDigest_key" ON "Citizen"("numberDigest");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "ConsentEvent_citizenId_createdAt_idx" ON "ConsentEvent"("citizenId", "createdAt");

-- CreateIndex
CREATE INDEX "Subscription_categoryId_active_idx" ON "Subscription"("categoryId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_citizenId_categoryId_key" ON "Subscription"("citizenId", "categoryId");

-- CreateIndex
CREATE INDEX "Project_status_publishedAt_idx" ON "Project"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "ProjectSource_projectId_createdAt_idx" ON "ProjectSource"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectSource_fingerprint_idx" ON "ProjectSource"("fingerprint");

-- CreateIndex
CREATE INDEX "Summary_projectId_status_generatedAt_idx" ON "Summary"("projectId", "status", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Summary_projectId_sourceFingerprint_promptVersion_modelConf_key" ON "Summary"("projectId", "sourceFingerprint", "promptVersion", "modelConfiguration");

-- CreateIndex
CREATE INDEX "Consultation_projectId_status_idx" ON "Consultation"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AudienceSnapshot_consultationId_citizenId_key" ON "AudienceSnapshot"("consultationId", "citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_snapshotId_key" ON "CampaignRecipient"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_idempotencyKey_key" ON "CampaignRecipient"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CampaignRecipient_status_updatedAt_idx" ON "CampaignRecipient"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_consultationId_citizenId_key" ON "CampaignRecipient"("consultationId", "citizenId");

-- CreateIndex
CREATE INDEX "ConversationState_activeUntil_idx" ON "ConversationState"("activeUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationState_citizenId_key" ON "ConversationState"("citizenId");

-- CreateIndex
CREATE INDEX "Opinion_projectId_optionKey_idx" ON "Opinion"("projectId", "optionKey");

-- CreateIndex
CREATE UNIQUE INDEX "Opinion_citizenId_projectId_key" ON "Opinion"("citizenId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "OpinionEvent_eventKey_key" ON "OpinionEvent"("eventKey");

-- CreateIndex
CREATE INDEX "OpinionEvent_projectId_createdAt_idx" ON "OpinionEvent"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AggregateResult_projectId_key" ON "AggregateResult"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AggregateResult_consultationId_key" ON "AggregateResult"("consultationId");

-- CreateIndex
CREATE INDEX "_CategoryToProject_B_index" ON "_CategoryToProject"("B");

-- AddForeignKey
ALTER TABLE "ConsentEvent" ADD CONSTRAINT "ConsentEvent_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSource" ADD CONSTRAINT "ProjectSource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceSnapshot" ADD CONSTRAINT "AudienceSnapshot_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudienceSnapshot" ADD CONSTRAINT "AudienceSnapshot_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "AudienceSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationState" ADD CONSTRAINT "ConversationState_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationState" ADD CONSTRAINT "ConversationState_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opinion" ADD CONSTRAINT "Opinion_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opinion" ADD CONSTRAINT "Opinion_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpinionEvent" ADD CONSTRAINT "OpinionEvent_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregateResult" ADD CONSTRAINT "AggregateResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregateResult" ADD CONSTRAINT "AggregateResult_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProject" ADD CONSTRAINT "_CategoryToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProject" ADD CONSTRAINT "_CategoryToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

