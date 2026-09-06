-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPrefrence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPrefrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Preference_name_key" ON "Preference"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_slug_key" ON "Preference"("slug");

-- CreateIndex
CREATE INDEX "Preference_name_idx" ON "Preference"("name");

-- CreateIndex
CREATE INDEX "Preference_id_idx" ON "Preference"("id");

-- CreateIndex
CREATE INDEX "UserPrefrence_userId_preferenceId_idx" ON "UserPrefrence"("userId", "preferenceId");

-- AddForeignKey
ALTER TABLE "UserPrefrence" ADD CONSTRAINT "UserPrefrence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrefrence" ADD CONSTRAINT "UserPrefrence_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "Preference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
