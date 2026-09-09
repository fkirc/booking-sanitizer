-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "import" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_document" (
    "company_code" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "posting_date" DATE NOT NULL,
    "source_hash" TEXT NOT NULL,
    "import_id" TEXT NOT NULL,

    CONSTRAINT "journal_document_pkey" PRIMARY KEY ("company_code","document_id")
);

-- CreateTable
CREATE TABLE "journal_line" (
    "company_code" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "line_id" INTEGER NOT NULL,
    "gl_account" TEXT NOT NULL,
    "cost_center" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "debit_credit" TEXT NOT NULL,
    "booking_text" TEXT NOT NULL,
    "vendor_id" TEXT,
    "customer_id" TEXT,
    "tax_code" TEXT,

    CONSTRAINT "journal_line_pkey" PRIMARY KEY ("company_code","document_id","line_id")
);

-- CreateTable
CREATE TABLE "gl_account" (
    "code" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "gl_account_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "cost_center" (
    "code" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "cost_center_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_code" (
    "code" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "tax_code_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "journal_document_source_hash_key" ON "journal_document"("source_hash");

-- AddForeignKey
ALTER TABLE "journal_document" ADD CONSTRAINT "journal_document_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "import"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_line" ADD CONSTRAINT "journal_line_company_code_document_id_fkey" FOREIGN KEY ("company_code", "document_id") REFERENCES "journal_document"("company_code", "document_id") ON DELETE RESTRICT ON UPDATE CASCADE;

