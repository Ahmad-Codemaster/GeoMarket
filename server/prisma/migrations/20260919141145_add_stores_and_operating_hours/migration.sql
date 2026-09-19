-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "vendor_profile_id" TEXT NOT NULL,
    "store_category_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "address_line" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "delivery_radius_km" DECIMAL(5,2) NOT NULL,
    "base_delivery_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Karachi',
    "status" "StoreStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_accepting_orders" BOOLEAN NOT NULL DEFAULT true,
    "rejection_reason" TEXT,
    "suspension_reason" TEXT,
    "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_operating_hours" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "opening_time" VARCHAR(5) NOT NULL,
    "closing_time" VARCHAR(5) NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_vendor_profile_id_idx" ON "stores"("vendor_profile_id");

-- CreateIndex
CREATE INDEX "stores_store_category_id_idx" ON "stores"("store_category_id");

-- CreateIndex
CREATE INDEX "stores_status_is_active_idx" ON "stores"("status", "is_active");

-- CreateIndex
CREATE INDEX "store_operating_hours_store_id_idx" ON "store_operating_hours"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_operating_hours_store_id_day_of_week_key" ON "store_operating_hours"("store_id", "day_of_week");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_vendor_profile_id_fkey" FOREIGN KEY ("vendor_profile_id") REFERENCES "vendor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_store_category_id_fkey" FOREIGN KEY ("store_category_id") REFERENCES "store_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_operating_hours" ADD CONSTRAINT "store_operating_hours_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
