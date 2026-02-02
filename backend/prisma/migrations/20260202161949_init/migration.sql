-- CreateTable
CREATE TABLE "intervenants" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "specialite" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intervenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duree" INTEGER NOT NULL,
    "lieu" TEXT NOT NULL,
    "intervenantId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intervenants_email_key" ON "intervenants"("email");

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_intervenantId_fkey" FOREIGN KEY ("intervenantId") REFERENCES "intervenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
