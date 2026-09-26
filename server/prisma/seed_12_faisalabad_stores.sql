-- ==============================================================================
-- GeoMarket: 12 Faisalabad Stores & 120 Products Seed Script for Supabase
-- Contains:
--   - 6 Big Faisalabad Superstores & Malls
--   - 6 Faisalabad IG & Boutique D2C Brands
--   - Exactly 10 authentic products per store (120 products total)
--   - Full 7-day operating hours per store (08:00 - 23:30)
--   - Real coordinates, PostGIS location auto-generation, high-res Unsplash images
-- ==============================================================================

DO $$
DECLARE
    v_vendor_id TEXT;
    v_store_id TEXT;
    v_cat_id TEXT;
    v_prod_cat_id TEXT;
    d INTEGER;
BEGIN
    -- 1. Locate or create active vendor profile
    SELECT id INTO v_vendor_id FROM "vendor_profiles" LIMIT 1;
    
    IF v_vendor_id IS NULL THEN
        RAISE EXCEPTION 'No vendor profile found in database. Please run initial migration first.';
    END IF;

    RAISE NOTICE 'Using Vendor Profile ID: %', v_vendor_id;


    -- --------------------------------------------------------------------------
    -- STORE: Imtiaz Super Market - Faisalabad
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'hypermarket-superstore' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'Imtiaz Super Market - Faisalabad', 'imtiaz-super-market-faisalabad', 'Pakistan''s premier mega hypermarket chain offering the widest selection of groceries, household essentials, imported delicacies, and fresh goods at wholesale rates.',
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400&q=80', 'Main Satiana Road, Near Batala Colony', 'Faisalabad', 31.4055, 73.1012,
        500, 99, 300, 'Asia/Karachi',
        'APPROVED', true, true, 4.85, 340,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: Mehran Super Basmati Rice (5kg Sealed Bag)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Mehran Super Basmati Rice (5kg Sealed Bag)', 'mehran-super-basmati-rice-5kg', 'Extra-long grain naturally aged aromatic basmati rice known for its delicate fragrance and slender non-sticky grains.',
        2350, 80, 'bag', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Sufi Canola Cooking Oil (5 Litre Tin)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Sufi Canola Cooking Oil (5 Litre Tin)', 'sufi-canola-cooking-oil-5l', 'Premium refined canola oil rich in Vitamin A, D, and E with zero cholesterol for a healthy active lifestyle.',
        2790, 65, 'tin', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Tapal Danedar Black Tea Economy Pack (900g)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Tapal Danedar Black Tea Economy Pack (900g)', 'tapal-danedar-black-tea-900g', 'Distinctive golden blend of tea leaves from high-grown gardens, delivering strong aroma and vibrant rich color.',
        1650, 120, 'pack', 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Surf Excel Matic Front Load Detergent Powder (3kg Box)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Surf Excel Matic Front Load Detergent Powder (3kg Box)', 'surf-excel-matic-front-load-3kg', 'Engineered for automatic washing machines to dissolve tough stains rapidly without leaving residue on fabrics.',
        2150, 50, 'box', 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Kellogg''s Corn Flakes Original Family Box (750g)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Kellogg''s Corn Flakes Original Family Box (750g)', 'kelloggs-corn-flakes-750g', 'Crispy sun-ripened corn flakes packed with iron and 8 essential vitamins for a wholesome nutritious breakfast.',
        1420, 45, 'box', 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Anex Deluxe 3-in-1 Blender, Grinder & Chopper (AG-694)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Anex Deluxe 3-in-1 Blender, Grinder & Chopper (AG-694)', 'anex-deluxe-3in1-blender-ag694', 'Powerful 500W pure copper motor with stainless steel blades, unbreakable polycarbonate jar, and safety lock.',
        8500, 18, 'piece', 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Prestige Non-Stick 28cm Granite Frying Pan with Glass Lid
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Prestige Non-Stick 28cm Granite Frying Pan with Glass Lid', 'prestige-nonstick-28cm-granite-pan', 'Multi-layer durable granite stone non-stick coating for oil-free cooking, compatible with induction and gas stovetops.',
        3850, 25, 'piece', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Harpic Power Plus Disinfectant Toilet Cleaner Twin Pack (2x 1L)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Harpic Power Plus Disinfectant Toilet Cleaner Twin Pack (2x 1L)', 'harpic-power-plus-twin-pack-2l', 'Specialized thick formula eliminates 99.9% of germs, removes tough limescale, and leaves a fresh clean fragrance.',
        980, 90, 'pack', 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Marhaba Pure Natural Sidr Honey (500g Hexagonal Glass)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Marhaba Pure Natural Sidr Honey (500g Hexagonal Glass)', 'marhaba-natural-sidr-honey-500g', '100% raw wild sidr honey harvest with deep amber color, rich floral aroma, and high antioxidant health benefits.',
        1450, 60, 'jar', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Mitchell''s Mixed Fruit Jam Big Glass Jar (800g)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Mitchell''s Mixed Fruit Jam Big Glass Jar (800g)', 'mitchells-mixed-fruit-jam-800g', 'Classic heritage fruit spread made from real mangoes, apples, and oranges. Delicious on morning toast and cakes.',
        680, 75, 'jar', 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- --------------------------------------------------------------------------
    -- STORE: Metro Cash & Carry - Faisalabad
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'hypermarket-superstore' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'Metro Cash & Carry - Faisalabad', 'metro-cash-carry-faisalabad', 'International wholesale giant offering bulk commercial food supplies, professional kitchen equipment, electronics, and household goods.',
        'https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80', 'Main Sargodha Road, Near Motorway M-4 Interchange', 'Faisalabad', 31.465, 73.082,
        500, 180, 1000, 'Asia/Karachi',
        'APPROVED', true, true, 4.8, 410,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: Lavazza Qualita Rossa Whole Coffee Beans (1kg Bag)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Lavazza Qualita Rossa Whole Coffee Beans (1kg Bag)', 'lavazza-qualita-rossa-beans-1kg', 'Classic Italian blend of Brazilian Arabica and African Robusta with chocolate and dried fruit undertones.',
        6500, 30, 'bag', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Aro Premium Extra Virgin Olive Oil Tin (5 Litres)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Aro Premium Extra Virgin Olive Oil Tin (5 Litres)', 'aro-extra-virgin-olive-oil-5l', 'First cold-pressed Mediterranean olive oil with well-balanced fruity taste, ideal for dressing and low-heat cooking.',
        14800, 25, 'tin', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Sunridge Whole Wheat Atta Fortified (20kg Bag)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Sunridge Whole Wheat Atta Fortified (20kg Bag)', 'sunridge-whole-wheat-atta-20kg', 'Pedia-smart fortified 100% whole wheat chakki atta rich in iron, zinc, and folic acid for soft rotis.',
        2850, 100, 'bag', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Nido Fortigrow Instant Whole Milk Powder (1.8kg Tin)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Nido Fortigrow Instant Whole Milk Powder (1.8kg Tin)', 'nido-fortigrow-milk-powder-1800g', 'Nutritious full cream milk powder fortified with 9 key micronutrients for cognitive and physical growth.',
        4200, 40, 'tin', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Westpoint Commercial Deep Fryer 3.5L Stainless Steel (WF-5231)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Westpoint Commercial Deep Fryer 3.5L Stainless Steel (WF-5231)', 'westpoint-commercial-deep-fryer-35l', 'Durable stainless steel housing with adjustable temperature thermostat, viewing window lid, and removable oil container.',
        16500, 12, 'piece', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Stainless Steel Commercial Cutlery 24-Piece Hospitality Set
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Stainless Steel Commercial Cutlery 24-Piece Hospitality Set', 'commercial-cutlery-24piece-set', 'Heavy gauge 18/10 mirror-polished stainless steel knives, forks, tablespoons, and dessert spoons.',
        5900, 20, 'set', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Rose Petal Maxob Jumbo Commercial Paper Towels (Pack of 6 Rolls)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Rose Petal Maxob Jumbo Commercial Paper Towels (Pack of 6 Rolls)', 'rose-petal-maxob-jumbo-towels-6pack', 'High-absorbency embossed kitchen paper rolls designed for heavy spills, grease absorption, and glass cleaning.',
        1850, 85, 'pack', 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Heavy Duty Industrial Plastic Storage Box with Wheels (120L)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Heavy Duty Industrial Plastic Storage Box with Wheels (120L)', 'heavy-duty-storage-box-wheels-120l', 'Reinforced BPA-free polypropylene storage tub with clip-lock handles and rolling wheels for bulk organization.',
        6200, 15, 'piece', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Commercial Microfiber Car & Multi-Surface Towels (Pack of 12)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Commercial Microfiber Car & Multi-Surface Towels (Pack of 12)', 'commercial-microfiber-towels-12pack', 'Ultra-soft scratch-free 400GSM microfiber towels for lint-free buffing, dusting, and kitchen hygiene.',
        1950, 70, 'pack', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Dettol Hospital-Grade Disinfectant Multi-Surface Sanitizer (5L)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Dettol Hospital-Grade Disinfectant Multi-Surface Sanitizer (5L)', 'dettol-hospital-grade-sanitizer-5l', 'Concentrated antibacterial surface disinfectant that kills 99.9% of bacteria and viruses in high-traffic zones.',
        3800, 35, 'can', 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- --------------------------------------------------------------------------
    -- STORE: SB Store (Sheikh Brothers)
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'fresh-grocery-produce' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'SB Store (Sheikh Brothers)', 'sb-store-faisalabad', 'Iconic D-Ground gourmet and departmental store renowned for imported delicacies, artisan cheeses, chocolates, and premium staples.',
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400&q=80', 'D-Ground Commercial Area, Peoples Colony No. 1', 'Faisalabad', 31.4128, 73.1085,
        500, 110, 250, 'Asia/Karachi',
        'APPROVED', true, true, 4.92, 385,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: Premium Saudi Medjool Jumbo Dates Box (1kg)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Premium Saudi Medjool Jumbo Dates Box (1kg)', 'saudi-medjool-jumbo-dates-1kg', 'Large, soft, and caramel-sweet royal medjool dates hand-sorted and packed under sterile conditions.',
        3200, 50, 'box', 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Callebaut 70.5% Belgian Dark Chocolate Callets (500g)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'bakery-desserts' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Callebaut 70.5% Belgian Dark Chocolate Callets (500g)', 'callebaut-70-dark-chocolate-500g', 'Finest Belgian dark couverture chocolate callets with intense roasted cocoa notes and balanced bitterness.',
        2850, 35, 'pack', 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Authentic Italian Parmigiano Reggiano DOP Cheese Wedge (250g)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'bakery-desserts' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Authentic Italian Parmigiano Reggiano DOP Cheese Wedge (250g)', 'parmigiano-reggiano-dop-250g', 'Aged 24 months in Emilia-Romagna. Crystalline crunchy texture with complex umami and nutty undertones.',
        2650, 25, 'wedge', 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Monini Classico Extra Virgin Cold-Pressed Olive Oil (1 Litre)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Monini Classico Extra Virgin Cold-Pressed Olive Oil (1 Litre)', 'monini-classico-olive-oil-1l', 'Italy''s beloved cold-extracted extra virgin olive oil with vibrant grassy aroma and gentle peppery kick.',
        3600, 45, 'bottle', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Bob''s Red Mill Super-Fine Almond Flour Gluten Free (453g)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Bob''s Red Mill Super-Fine Almond Flour Gluten Free (453g)', 'bobs-red-mill-almond-flour-453g', 'Pure whole skinless blanched almonds ground into fine flour for delicate low-carb baking and macarons.',
        2950, 30, 'pack', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Quaker Whole Grain Rolled Porridge Oats (1kg Tin)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Quaker Whole Grain Rolled Porridge Oats (1kg Tin)', 'quaker-rolled-porridge-oats-1kg', '100% natural wholegrain rolled oats high in soluble fiber beta-glucan to support healthy heart and digestion.',
        1180, 70, 'tin', 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Japanese Ceremonial Grade Organic Matcha Powder (100g Tin)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Japanese Ceremonial Grade Organic Matcha Powder (100g Tin)', 'japanese-ceremonial-matcha-100g', 'First-harvest shade-grown stone-ground tencha tea leaves from Uji, Kyoto. Rich in L-theanine and antioxidants.',
        3900, 22, 'tin', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Barilla Collezione Fettuccine Bronze Cut Artisan Pasta (500g)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Barilla Collezione Fettuccine Bronze Cut Artisan Pasta (500g)', 'barilla-collezione-fettuccine-500g', 'Traditional bronze die-extruded durum wheat semolina pasta that holds creamy Alfredo sauces with perfection.',
        1250, 60, 'box', 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Bonne Maman Wild Strawberry Preserves (370g Glass Jar)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Bonne Maman Wild Strawberry Preserves (370g Glass Jar)', 'bonne-maman-strawberry-preserves-370g', 'Handcrafted French jam packed with ripe whole wild strawberries, cane sugar, and concentrated lemon juice.',
        1480, 40, 'jar', 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Himalayan Pink Crystal Rock Salt Ceramic Grinder (380g)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Himalayan Pink Crystal Rock Salt Ceramic Grinder (380g)', 'himalayan-pink-rock-salt-grinder-380g', 'Unrefined mineral-rich Khewra rock salt crystals inside an adjustable ceramic burr kitchen grinder.',
        750, 90, 'grinder', 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- --------------------------------------------------------------------------
    -- STORE: ChenOne Luxury Living & Fashion
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'fashion-apparel' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'ChenOne Luxury Living & Fashion', 'chenone-faisalabad', 'Premier home lifestyle brand offering luxury bedding, curated interior decor, executive menswear, and high-fashion pret wear.',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=400&q=80', 'Mall Road, Civil Lines', 'Faisalabad', 31.4182, 73.079,
        500, 150, 500, 'Asia/Karachi',
        'APPROVED', true, true, 4.89, 290,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: ChenOne 400-Thread Count Egyptian Cotton King Duvet Set (6 Pcs)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'ChenOne 400-Thread Count Egyptian Cotton King Duvet Set (6 Pcs)', 'chenone-400tc-egyptian-cotton-duvet-set', 'Silky smooth sateen weave bedding set with 1 king duvet cover, 1 flat sheet, 2 standard pillow shams, and 2 cushion covers.',
        14500, 20, 'set', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Ergonomic Cooling Gel Memory Foam Sleeping Pillow
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Ergonomic Cooling Gel Memory Foam Sleeping Pillow', 'ergonomic-cooling-gel-pillow', 'Contoured neck support pillow infused with cooling hydro-gel to dissipate heat and relieve cervical pressure.',
        4800, 35, 'piece', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Hand-Embroidered Pure Linen Dining Table Runner Set
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Hand-Embroidered Pure Linen Dining Table Runner Set', 'hand-embroidered-linen-table-runner', 'Artisanal hand-stitched floral vine motif table runner accompanied by 6 matching linen napkins.',
        3950, 25, 'set', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Men''s Italian Wool-Blend Tailored Slim Fit Navy Blazer
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Men''s Italian Wool-Blend Tailored Slim Fit Navy Blazer', 'mens-italian-wool-blend-blazer-navy', 'Structured notch lapel jacket crafted from breathable wool-blend fabric with double back vents and horn buttons.',
        19500, 15, 'piece', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Women''s Pure Raw Silk Stitched Festive Evening Tunic
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Women''s Pure Raw Silk Stitched Festive Evening Tunic', 'womens-raw-silk-festive-evening-tunic', 'Rich emerald green raw silk tunic detailed with antique gold tilla neckline embroidery and scalloped cuffs.',
        16800, 18, 'suit', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Midnight Amber & Oudh Luxury Aromatherapy Scented Soy Candle
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Midnight Amber & Oudh Luxury Aromatherapy Scented Soy Candle', 'midnight-amber-oudh-soy-candle', 'Slow-burning natural soy wax candle infused with aged Cambodian oudh, warm amber, and smoke woods. 55-hour burn time.',
        3200, 40, 'piece', 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: ChenOne Porcelain Artisan Dinnerware Set (16 Pieces)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'ChenOne Porcelain Artisan Dinnerware Set (16 Pieces)', 'chenone-porcelain-artisan-dinnerware-16pc', 'Chip-resistant glazed fine porcelain service for 4, including dinner plates, side plates, soup bowls, and mugs.',
        18900, 12, 'set', 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Zero-Twist 100% Combed Cotton Plush Bath Towel Set (4 Pcs)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Zero-Twist 100% Combed Cotton Plush Bath Towel Set (4 Pcs)', 'zero-twist-combed-cotton-towel-set-4pc', 'Ultra-absorbent 650GSM luxury hotel-grade towels: 2 oversized bath towels and 2 matching hand towels.',
        5400, 30, 'set', 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Handcrafted Vintage Top-Grain Leather Messenger Briefcase
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Handcrafted Vintage Top-Grain Leather Messenger Briefcase', 'handcrafted-leather-messenger-briefcase', 'Full-grain oiled buffalo leather with padded 15.6-inch laptop compartment, antique brass hardware, and shoulder strap.',
        15900, 10, 'piece', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Modern Minimalist Brushed Brass Table Lamp with Linen Shade
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Modern Minimalist Brushed Brass Table Lamp with Linen Shade', 'modern-brushed-brass-table-lamp', 'Solid brass base with matte brushed finish, warm LED bulb included, and natural woven cream linen lampshade.',
        8750, 16, 'piece', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- --------------------------------------------------------------------------
    -- STORE: Victoria Departmental Store
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'shopping-mall-department' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'Victoria Departmental Store', 'victoria-departmental-faisalabad', 'Popular multi-story departmental emporium in Kohinoor City featuring cosmetics, infant nutrition, personal wellness, and home conveniences.',
        'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80', 'Jaranwala Road, Near Kohinoor City', 'Faisalabad', 31.414, 73.1145,
        500, 120, 350, 'Asia/Karachi',
        'APPROVED', true, true, 4.78, 260,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: Dior Sauvage Eau de Parfum for Men (100ml)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Dior Sauvage Eau de Parfum for Men (100ml)', 'dior-sauvage-edp-100ml', 'A powerful sensual composition with juicy Calabrian bergamot, smoky Papua New Guinean vanilla extract, and amberwood.',
        42000, 14, 'bottle', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Remington Keratin Protect Ceramic Hair Straightener (S8598)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Remington Keratin Protect Ceramic Hair Straightener (S8598)', 'remington-keratin-protect-hair-straightener', 'Infused with keratin and almond oil for 3x more protection against damage. Digital display with 5 heat settings up to 230°C.',
        14500, 20, 'piece', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Pampers Premium Protection Pants Diapers Size 4 (Mega Box 104 Pcs)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Pampers Premium Protection Pants Diapers Size 4 (Mega Box 104 Pcs)', 'pampers-premium-pants-size4-104pcs', 'Ultra-soft feather-like materials with 360-degree comfort fit and up to 12 hours of reliable all-around leakage protection.',
        5800, 45, 'box', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Aptamil Gold+ Stage 3 Infant Formula Milk (900g Imported Tin)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Aptamil Gold+ Stage 3 Infant Formula Milk (900g Imported Tin)', 'aptamil-gold-stage3-900g', 'Scientifically developed toddler milk drink with prebiotic scGOS/lcFOS fibers, zinc, and omega-3 DHA for development.',
        4600, 35, 'tin', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Russell Hobbs Retro Vintage Stainless Steel Kettle 1.7L
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Russell Hobbs Retro Vintage Stainless Steel Kettle 1.7L', 'russell-hobbs-retro-kettle-17l', 'Charming vintage aesthetic with rapid boil zone, water temperature gauge, 360-degree base, and removable washable filter.',
        12800, 15, 'piece', 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Tommy Hilfiger Men''s Genuine Leather Slim Bifold Wallet
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Tommy Hilfiger Men''s Genuine Leather Slim Bifold Wallet', 'tommy-hilfiger-leather-slim-wallet', 'Smooth sheepskin leather bifold featuring iconic flag inlay, 6 credit card slots, and double currency compartment.',
        9500, 25, 'piece', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: L''Occitane En Provence Revitalizing Essential Oils Shampoo (500ml)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'L''Occitane En Provence Revitalizing Essential Oils Shampoo (500ml)', 'loccitane-revitalizing-shampoo-500ml', 'Formulated with rosemary, mint, and cedar essential oils to deeply cleanse, refresh scalp, and fortify hair strands.',
        6800, 22, 'bottle', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF50+ (50ml)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF50+ (50ml)', 'la-roche-posay-anthelios-spf50-50ml', 'Ultra-long UVA ray filter with invisible light texture. Highly resistant to water and sweat, non-greasy on acne-prone skin.',
        5400, 40, 'bottle', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: American Tourister Sunside Hardside 4-Wheel Cabin Luggage 55cm
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'sports-fitness' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'American Tourister Sunside Hardside 4-Wheel Cabin Luggage 55cm', 'american-tourister-sunside-cabin-luggage', 'Lightweight polypropylene shell with double 360-degree spinner wheels, integrated TSA 3-digit combination lock, and expandable volume.',
        26000, 8, 'piece', 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Tefal UltraCompact 700W Non-Stick Toast & Panini Maker
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Tefal UltraCompact 700W Non-Stick Toast & Panini Maker', 'tefal-ultracompact-panini-maker-700w', 'Vertical compact storage with non-stick coated grill plates for effortless cheese melt cleaning and perfectly crisp paninis.',
        9200, 18, 'piece', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- --------------------------------------------------------------------------
    -- STORE: Raja Sahib Mega Store
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'shopping-mall-department' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'Raja Sahib Mega Store', 'raja-sahib-faisalabad', 'Renowned retail destination featuring bridal couturiers, formal menswear, fine jewelry, crystal lighting, and luxury household linen.',
        'https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?auto=format&fit=crop&w=400&q=80', 'Jaranwala Road, Kohinoor Commercial Area', 'Faisalabad', 31.411, 73.113,
        500, 130, 500, 'Asia/Karachi',
        'APPROVED', true, true, 4.84, 315,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: Maria.B Bridal Heavy Hand-Embellished Pure Chiffon 3-Piece Formals
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Maria.B Bridal Heavy Hand-Embellished Pure Chiffon 3-Piece Formals', 'mariab-bridal-hand-embellished-chiffon-formals', 'Exquisite festive ensemble adorned with pearls, sequins, dabka, and nakshi embroidery over premium pure chiffon.',
        38500, 10, 'suit', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Men''s Royal Raw Silk Embroidered Groom Sherwani Kurta Suit
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Men''s Royal Raw Silk Embroidered Groom Sherwani Kurta Suit', 'mens-royal-raw-silk-groom-sherwani', 'Imperial champagne raw silk sherwani kurta tailored with regal mandarin collar and delicate tone-on-tone embroidery.',
        24000, 12, 'suit', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Handcrafted Zardozi Embroidered Velvet Traditional Khussa Shoes
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Handcrafted Zardozi Embroidered Velvet Traditional Khussa Shoes', 'handcrafted-zardozi-velvet-khussa', 'Pure velvet outer embellished with hand-stitched zardozi wire and sequins, fitted with padded leather insole.',
        5800, 25, 'pair', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Bohemian Cut Crystal 5-Arm Luxury Dining Room Chandelier
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'home-appliances' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Bohemian Cut Crystal 5-Arm Luxury Dining Room Chandelier', 'bohemian-cut-crystal-5arm-chandelier', 'Brilliant faceted K9 optical crystal prisms suspended on chrome metal framework with 5 warm E14 candle fittings.',
        48000, 5, 'piece', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: 22K Gold-Plated Kundan & Emerald Choker Necklace Jewellery Set
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, '22K Gold-Plated Kundan & Emerald Choker Necklace Jewellery Set', '22k-gold-plated-kundan-emerald-necklace-set', 'Heritage bridal jewelry set featuring handcrafted kundan stones, faux emerald drops, matching earrings, and maang tikka.',
        12500, 15, 'set', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Heavy Quilted Embroidered Velvet Bridal Bedspread Set (8 Pcs)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Heavy Quilted Embroidered Velvet Bridal Bedspread Set (8 Pcs)', 'heavy-quilted-velvet-bridal-bedspread-set', 'Luxurious micro-velvet bedspread with heavy gold thread embroidery, 2 quilted shams, 2 accent pillows, and 2 bolsters.',
        22500, 8, 'set', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Handmade Italian Burnished Leather Oxford Formal Brogue Shoes
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Handmade Italian Burnished Leather Oxford Formal Brogue Shoes', 'handmade-italian-burnished-leather-brogues', 'Artisanal hand-burnished calfskin leather shoes with wingtip perforations and Goodyear welted genuine leather soles.',
        14500, 16, 'pair', 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Boys Festive Embroidered Jacquard Kurta Pajama with Waistcoat Set
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Boys Festive Embroidered Jacquard Kurta Pajama with Waistcoat Set', 'boys-festive-jacquard-kurta-waistcoat-set', 'Smart traditional outfit for celebrations featuring self-embossed jacquard fabric and coordinating contrasting waistcoat.',
        5900, 22, 'set', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Embellished Pearl & Rhinestone Minaudiere Evening Clutch Bag
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Embellished Pearl & Rhinestone Minaudiere Evening Clutch Bag', 'embellished-pearl-rhinestone-clutch-bag', 'Hard-shell evening minaudiere covered with simulated pearls and sparkling crystals with a detachable gold snake chain.',
        6500, 20, 'piece', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Pure Silk Digital Floral Printed Designer Evening Dupatta Scarf
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Pure Silk Digital Floral Printed Designer Evening Dupatta Scarf', 'pure-silk-digital-floral-dupatta', 'Feather-light pure Chinese silk dupatta featuring vibrant botanical blooms and finished with hand-rolled picot edges.',
        4800, 28, 'piece', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- --------------------------------------------------------------------------
    -- STORE: La Mosaik Designer Studio
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'fashion-apparel' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'La Mosaik Designer Studio', 'la-mosaik-faisalabad', 'Chic fashion atelier known on Instagram for curated pret collections, festive organza wear, artisan lawn prints, and elegant shawls.',
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80', 'Kohinoor One Commercial Plaza, Jaranwala Road', 'Faisalabad', 31.412, 73.1125,
        500, 140, 400, 'Asia/Karachi',
        'APPROVED', true, true, 4.91, 185,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: Embroidered Organza Mirror-Work Formal Shirt (Stitched)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Embroidered Organza Mirror-Work Formal Shirt (Stitched)', 'embroidered-organza-mirror-work-shirt', 'Delicate sheer organza shirt embellished with real mirror accents, silver resham threadwork, and inner slip included.',
        12500, 14, 'piece', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Digital Printed Pure Silk Kaftan with Tassel Tie Belt
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Digital Printed Pure Silk Kaftan with Tassel Tie Belt', 'digital-printed-silk-kaftan-belt', 'Flowing relaxed silhouette in 100% pure silk with vivid botanical prints and hand-knotted braided fringe tie.',
        9800, 20, 'piece', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Chikankari Embroidered Lawn 2-Piece Kurta & Trousers
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Chikankari Embroidered Lawn 2-Piece Kurta & Trousers', 'chikankari-embroidered-lawn-2piece', 'Handcrafted tonal Lucknowi chikankari embroidery on breathable cotton lawn with matching straight-cut pants.',
        7500, 30, 'suit', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Schiffli Scalloped Cotton Culottes (Ivory White)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Schiffli Scalloped Cotton Culottes (Ivory White)', 'schiffli-scalloped-cotton-culottes-white', 'Premium Swiss schiffli embroidered hems with eyelet detailing on comfortable stretch cambric cotton.',
        3400, 40, 'piece', 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Handwoven Winter Khaddar Embroidered 3-Piece Stitched Suit
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Handwoven Winter Khaddar Embroidered 3-Piece Stitched Suit', 'handwoven-winter-khaddar-suit-3pc', 'Warm textured spun khaddar suit with Kashmiri needlepoint embroidery and matching heavy woven shawl.',
        8900, 22, 'suit', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Artisanal Ajrak Hand Block-Printed Modal Dupatta
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Artisanal Ajrak Hand Block-Printed Modal Dupatta', 'artisanal-ajrak-block-printed-dupatta', 'Authentic vegetable dye geometric Ajrak block print on feather-soft sustainable modal silk fabric.',
        2800, 35, 'piece', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Crimson Red Zari Threadwork Festive Party Kurta
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Crimson Red Zari Threadwork Festive Party Kurta', 'crimson-red-zari-festive-kurta', 'Striking rich crimson dyed cotton satin kurta adorned with golden zari and badla embroidery across yoke.',
        11200, 16, 'piece', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Crinkle Chiffon Stitched Formal Dupatta with Gota Patti
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Crinkle Chiffon Stitched Formal Dupatta with Gota Patti', 'crinkle-chiffon-dupatta-gota-patti', 'Traditional handcrafted golden gota patti kinari border framing four sides of pre-crinkled fine chiffon.',
        3200, 28, 'piece', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Tailored Raw Silk Cigarette Pants with Pearl Buttons
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Tailored Raw Silk Cigarette Pants with Pearl Buttons', 'raw-silk-cigarette-pants-pearl-buttons', 'Structured narrow-leg raw silk trousers with side slit accents and lustrous mother-of-pearl buttons.',
        3900, 32, 'piece', 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Luxury Heavy Embroidered Velvet Shawl with Tilla Work Border
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Luxury Heavy Embroidered Velvet Shawl with Tilla Work Border', 'luxury-embroidered-velvet-shawl-tilla', 'Opulent midnight black micro-velvet winter shawl embellished with intricate floral tilla borders and corner paisleys.',
        18500, 12, 'piece', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- --------------------------------------------------------------------------
    -- STORE: Hustle N Holla / Streetwear Studio
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'fashion-apparel' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'Hustle N Holla / Streetwear Studio', 'streetwear-studio-faisalabad', 'Trendy D2C fashion hub delivering oversized graphic hoodies, relaxed wide-leg denim, tactical cargo pants, and contemporary streetwear.',
        'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=400&q=80', 'Susan Road, Near D-Ground, Madina Town', 'Faisalabad', 31.424, 73.123,
        500, 120, 300, 'Asia/Karachi',
        'APPROVED', true, true, 4.87, 210,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: Acid-Wash 420GSM Heavyweight Oversized Cotton Hoodie
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Acid-Wash 420GSM Heavyweight Oversized Cotton Hoodie', 'acid-wash-420gsm-oversized-hoodie', 'Ultra-heavy loopback French terry cotton with relaxed dropped shoulders, double-layered hood, and ribbed hems.',
        5800, 35, 'piece', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Relaxed Wide-Leg Skate Denim Jeans (Washed Indigo)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Relaxed Wide-Leg Skate Denim Jeans (Washed Indigo)', 'relaxed-wide-leg-skate-denim-indigo', 'Authentic 13.5oz non-stretch rigid denim with classic 5-pocket styling and extra loose skater leg silhouette.',
        4950, 40, 'piece', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Vintage Cyberpunk Graphic Drop-Shoulder Tee (100% Cotton)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Vintage Cyberpunk Graphic Drop-Shoulder Tee (100% Cotton)', 'vintage-cyberpunk-graphic-tee', '240GSM combed cotton jersey with distressed puff screen print across the back and boxy oversized fit.',
        2800, 60, 'piece', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Multi-Pocket Tactical Parachute Cargo Pants with Drawcords
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Multi-Pocket Tactical Parachute Cargo Pants with Drawcords', 'tactical-parachute-cargo-pants', 'Lightweight ripstop nylon fabric with 6 deep utility bellows pockets and bungee-cord adjustable ankle cuffs.',
        4600, 30, 'piece', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Cozy Brushed Fleece Unisex Cuffed Jogger Sweatpants
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'sports-fitness' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Cozy Brushed Fleece Unisex Cuffed Jogger Sweatpants', 'brushed-fleece-unisex-cuffed-joggers', 'Plush inner brushed fleece with comfortable elastic drawstring waistband and deep side zip security pockets.',
        3400, 50, 'piece', 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Embroidered Chenille Letterman Varsity Bomber Jacket
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Embroidered Chenille Letterman Varsity Bomber Jacket', 'chenille-letterman-varsity-bomber-jacket', 'Wool-blend body with faux leather sleeves, custom chenille chest crest patches, and striped ribbed collar.',
        8900, 18, 'piece', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Heavy 16oz Cotton Canvas Streetwear Daily Tote Bag
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Heavy 16oz Cotton Canvas Streetwear Daily Tote Bag', 'heavy-canvas-streetwear-tote-bag', 'Durable reinforced canvas shopper with inner zippered valuables pouch and heavy webbing shoulder straps.',
        1950, 55, 'piece', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Chunky Sole Retro Runner Platform Dad Sneakers
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'sports-fitness' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Chunky Sole Retro Runner Platform Dad Sneakers', 'chunky-sole-retro-runner-sneakers', 'Layered breathable mesh and vegan suede upper with sculpted EVA shock-absorbing platform midsole.',
        7800, 24, 'pair', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Water-Resistant Ripstop Nylon Outdoor Bucket Hat
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Water-Resistant Ripstop Nylon Outdoor Bucket Hat', 'water-resistant-ripstop-bucket-hat', 'Packable all-weather bucket hat with breathable side brass eyelets and detachable reflective chin cord.',
        1600, 45, 'piece', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Distressed Vintage Blue Denim Buttoned Trucker Jacket
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Distressed Vintage Blue Denim Buttoned Trucker Jacket', 'distressed-vintage-denim-trucker-jacket', 'Classic American workwear trucker with copper shank buttons, flap chest pockets, and subtle distressed abrasions.',
        6500, 22, 'piece', 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- --------------------------------------------------------------------------
    -- STORE: Aura Botanicals & Organic Skincare
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'pharmacy-health' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'Aura Botanicals & Organic Skincare', 'aura-botanicals-faisalabad', 'Artisanal clean beauty brand on Instagram formulating fresh small-batch plant serums, cold-pressed soaps, and clean glow essentials.',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80', 'Main Commercial Boulevard, Peoples Colony No. 1', 'Faisalabad', 31.4195, 73.118,
        500, 99, 200, 'Asia/Karachi',
        'APPROVED', true, true, 4.96, 275,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: Cold-Pressed Organic Rosehip Seed Facial Glow Oil (30ml)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Cold-Pressed Organic Rosehip Seed Facial Glow Oil (30ml)', 'cold-pressed-organic-rosehip-seed-oil-30ml', 'Unrefined Chilean rosehip seed oil rich in provitamin A and linoleic acid to fade acne marks and restore barrier.',
        2850, 45, 'bottle', 'https://images.unsplash.com/photo-1608248597359-00f074a38753?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Clarifying 10% Niacinamide + 1% Zinc Blemish Serum (30ml)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Clarifying 10% Niacinamide + 1% Zinc Blemish Serum (30ml)', 'clarifying-10-niacinamide-zinc-serum-30ml', 'High-strength vitamin and mineral blemish formula to balance sebum activity and minimize enlarged facial pores.',
        2400, 55, 'bottle', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Australian Tea Tree & French Green Clay Purifying Detox Mask
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Australian Tea Tree & French Green Clay Purifying Detox Mask', 'tea-tree-green-clay-purifying-mask', 'Mineral-rich detoxifying facial clay that draws out micro-pollutants and impurities without stripping skin hydration.',
        1950, 40, 'jar', 'https://images.unsplash.com/photo-1567928815117-07449c25674c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Artisanal Raw Goat Milk & Organic Wild Honey Cold-Processed Soap
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Artisanal Raw Goat Milk & Organic Wild Honey Cold-Processed Soap', 'raw-goat-milk-wild-honey-soap-bar', 'Handmade cured for 6 weeks with fresh pasture goat milk, virgin olive oil, and raw honey for sensitive dry skin.',
        650, 110, 'bar', 'https://images.unsplash.com/photo-1607006310467-33678eb178b8?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Damask Rosewater & Hyaluronic Acid Facial Hydrating Mist (120ml)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Damask Rosewater & Hyaluronic Acid Facial Hydrating Mist (120ml)', 'damask-rosewater-hyaluronic-mist-120ml', 'Pure steam-distilled Choa Saidan Shah rose hydrosol infused with low-molecular hyaluronic acid for instant dewy glow.',
        1600, 65, 'bottle', 'https://images.unsplash.com/photo-1556228722-d0b5d5d8fb48?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Pure Rosemary & Mint Scalp Stimulating Hair Growth Elixir (50ml)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Pure Rosemary & Mint Scalp Stimulating Hair Growth Elixir (50ml)', 'rosemary-mint-scalp-growth-elixir-50ml', 'Nutrient-rich golden jojoba and castor oil carrier infused with pure steam-distilled rosemary verbenone essential oil.',
        2200, 75, 'bottle', 'https://images.unsplash.com/photo-1608248597359-00f074a38753?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Organic Pure Aloe Vera Soothing & Cooling Multi-Purpose Gel (200ml)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Organic Pure Aloe Vera Soothing & Cooling Multi-Purpose Gel (200ml)', 'organic-pure-aloe-vera-soothing-gel-200ml', '99% cold-pressed organic aloe barbadensis inner leaf fillet juice. Calms sunburns, razor irritation, and dehydrated skin.',
        950, 90, 'tube', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Raw Unrefined African Shea Butter Whipped Deep Body Cream (200g)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Raw Unrefined African Shea Butter Whipped Deep Body Cream (200g)', 'raw-african-shea-butter-body-cream-200g', 'Air-whipped Grade A fair-trade shea butter blended with sweet almond oil and Madagascar vanilla bean extract.',
        1850, 50, 'jar', 'https://images.unsplash.com/photo-1556228722-d0b5d5d8fb48?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: All-Natural Beetroot Extract Tinted Lip & Cheek Dewy Tint
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'All-Natural Beetroot Extract Tinted Lip & Cheek Dewy Tint', 'beetroot-extract-lip-cheek-dewy-tint', 'Multi-use natural cheek flush formulated with organic beetroot pigment, vitamin E, and organic beeswax.',
        1150, 80, 'bottle', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Caffeine & Pure Vitamin C Awakening Radiance Eye Contour Cream
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'perfumes-cosmetics' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Caffeine & Pure Vitamin C Awakening Radiance Eye Contour Cream', 'caffeine-vitamin-c-awakening-eye-cream', 'De-puffing green coffee extract paired with stabilized Vitamin C to brighten dark circles and refresh tired eyes.',
        2100, 60, 'tube', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- --------------------------------------------------------------------------
    -- STORE: The Leather Craft & Artisanal Shoes
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'fashion-apparel' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'The Leather Craft & Artisanal Shoes', 'the-leather-craft-faisalabad', 'Heritage leather masters handcrafting genuine full-grain leather bags, Kaptaan Peshawari chappals, Oxford shoes, and slim wallets.',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80', 'Civil Lines, Near Chenab Club', 'Faisalabad', 31.4165, 73.076,
        500, 130, 400, 'Asia/Karachi',
        'APPROVED', true, true, 4.93, 195,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: Full-Grain Buff Calf Leather Weekender Duffle Travel Bag
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Full-Grain Buff Calf Leather Weekender Duffle Travel Bag', 'full-grain-leather-weekender-duffle-bag', 'Robust vegetable-tanned pull-up leather duffle with heavy YKK brass zippers, shoe compartment, and cotton canvas lining.',
        18500, 12, 'piece', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Kaptaan Classic Handcrafted Leather Peshawari Chappal (Double Sole)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Kaptaan Classic Handcrafted Leather Peshawari Chappal (Double Sole)', 'kaptaan-leather-peshawari-chappal-double-sole', 'Iconic pointed-toe Peshawari chappal hand-stitched by master artisans using thick cowhide and durable tire tread sole.',
        6900, 35, 'pair', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Minimalist Vegetable-Tanned Bifold Leather Card & Cash Wallet
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Minimalist Vegetable-Tanned Bifold Leather Card & Cash Wallet', 'minimalist-bifold-leather-wallet', 'Ultra-slim profile crafted from Italian Badalassi Carlo wax leather that ages into a gorgeous unique patina over time.',
        2800, 45, 'piece', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Heavy Duty Solid Brass Buckle Full-Grain Leather Jean Belt
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Heavy Duty Solid Brass Buckle Full-Grain Leather Jean Belt', 'solid-brass-buckle-leather-belt', 'Single continuous cut of 4mm thick English bridle leather with bevelled hand-burnished edges and cast solid brass buckle.',
        2450, 50, 'piece', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Vintage Snap-Button Leather Key Organizer & Keyring Holder
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Vintage Snap-Button Leather Key Organizer & Keyring Holder', 'vintage-leather-key-organizer-holder', 'Keeps up to 6 keys wrapped quietly and neatly to protect phone screens and pocket linings from scratching.',
        950, 80, 'piece', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Goodyear-Welted Full-Grain Leather Oxford Dress Shoes (Cognac Brown)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Goodyear-Welted Full-Grain Leather Oxford Dress Shoes (Cognac Brown)', 'goodyear-welted-leather-oxford-shoes-cognac', 'Handmade closed-lacing dress shoes with hand-painted burnished finish, cork footbed filling, and resoleable leather soles.',
        15500, 15, 'pair', 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: RFID-Protected Genuine Leather Passport & Boarding Pass Travel Case
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'RFID-Protected Genuine Leather Passport & Boarding Pass Travel Case', 'rfid-leather-passport-travel-case', 'Multi-functional travel wallet holding passport, 4 credit cards, boarding passes, and SIM cards with RFID shielding.',
        3200, 30, 'piece', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Artisanal Suede Leather Driving Loafers with Rubber Pebble Soles
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Artisanal Suede Leather Driving Loafers with Rubber Pebble Soles', 'artisanal-suede-driving-loafers', 'Supple Italian split suede moccasin with hand-stitched apron toe and flexible studded rubber driving tread.',
        8500, 20, 'pair', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Padded Genuine Leather Laptop Sleeve Case for 14-inch MacBook
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'computers-laptops' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Padded Genuine Leather Laptop Sleeve Case for 14-inch MacBook', 'padded-leather-laptop-sleeve-14inch', 'Shock-absorbing microfiber velvet interior lined inside water-resistant smooth full-grain cowhide leather.',
        4800, 25, 'piece', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Ultra-Thin Slim RFID Front Pocket Leather Cardholder Wallet
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'mens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Ultra-Thin Slim RFID Front Pocket Leather Cardholder Wallet', 'slim-rfid-front-pocket-cardholder', 'Features 4 card slots, a central cash pocket, and quick-access thumb slide slot in a 3mm thin profile.',
        1600, 60, 'piece', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- --------------------------------------------------------------------------
    -- STORE: Kross Kulture Contemporary Pret
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'fashion-apparel' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'Kross Kulture Contemporary Pret', 'kross-kulture-faisalabad', 'Modern fusion boutique spotlighting tailored ready-to-wear kurtas, chic monochrome co-ord sets, jacquard pret, and boho jackets.',
        'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80', 'Main Susan Road, Madina Town', 'Faisalabad', 31.426, 73.1265,
        500, 120, 350, 'Asia/Karachi',
        'APPROVED', true, true, 4.86, 160,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: Geometric Cross-Stitch Embroidered Cotton Pret Shirt
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Geometric Cross-Stitch Embroidered Cotton Pret Shirt', 'geometric-cross-stitch-embroidered-shirt', 'Contemporary ethnic motifs embroidered across the neckline and raglan sleeves on structured slub cotton.',
        6800, 22, 'piece', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Minimalist Monochrome Co-ord Set with Button-Down Tunic & Flared Pants
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Minimalist Monochrome Co-ord Set with Button-Down Tunic & Flared Pants', 'minimalist-monochrome-coord-set', 'Effortless everyday matching set crafted from wrinkle-resistant blended linen in rich olive tone.',
        8500, 18, 'set', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Asymmetrical Hemline Printed Cotton Tunic with Wooden Buttons
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Asymmetrical Hemline Printed Cotton Tunic with Wooden Buttons', 'asymmetrical-hemline-printed-tunic', 'Modern silhouette featuring a high-low handkerchief hemline, mandarin collar, and sustainable coconut shell buttons.',
        4900, 25, 'piece', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Pleated Front High-Waist Cotton Culottes (Jet Black)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Pleated Front High-Waist Cotton Culottes (Jet Black)', 'pleated-high-waist-cotton-culottes-black', 'Wide cropped pants featuring tailored front pleats, elasticated back comfort waistband, and deep side pockets.',
        2900, 35, 'piece', 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Pastel Mint Floral Jacquard Stitched Festive Kurta
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Pastel Mint Floral Jacquard Stitched Festive Kurta', 'pastel-mint-floral-jacquard-kurta', 'Lustrous self-weave jacquard fabric embellished with delicate pearl buttons and crystal lace along sleeve cuffs.',
        7200, 20, 'piece', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Tailored Embroidered Ethnic Sleeveless Waistcoat for Women
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Tailored Embroidered Ethnic Sleeveless Waistcoat for Women', 'tailored-embroidered-ethnic-waistcoat', 'Versatile layering piece featuring vibrant Kashmiri phulkari thread embroidery and satin inner lining.',
        4500, 24, 'piece', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Digital Printed Premium Satin Silk Scarf (Square 90x90cm)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Digital Printed Premium Satin Silk Scarf (Square 90x90cm)', 'digital-printed-satin-silk-scarf-90x90', 'Glossy Italian-inspired artistic abstract print with hand-finished rolled borders, perfect as neck scarf or hijab.',
        2400, 40, 'piece', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Tiered Bohemian Maxi Dress in Crinkle Chiffon with Belt
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Tiered Bohemian Maxi Dress in Crinkle Chiffon with Belt', 'tiered-bohemian-maxi-dress-chiffon', 'Romantic tiered gathered skirt with bishop sleeves, shirred elastic cuffs, and detachable woven buckle belt.',
        9800, 14, 'piece', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Crisp Pure Linen Summer Shirt with Delicate Lace Edging
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Crisp Pure Linen Summer Shirt with Delicate Lace Edging', 'crisp-pure-linen-summer-shirt-lace', '100% natural European flax linen shirt featuring crochet lace insets on the collar and hemline.',
        5600, 26, 'piece', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Ethnic Embroidered Kimono Shrug Over-Jacket with Fringe Trims
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'womens-fashion' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Ethnic Embroidered Kimono Shrug Over-Jacket with Fringe Trims', 'ethnic-embroidered-kimono-shrug-fringe', 'Boho-chic open front kimono jacket embellished with geometric folk embroidery and bohemian fringe hem details.',
        6200, 18, 'piece', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- --------------------------------------------------------------------------
    -- STORE: Mika Organic Pantry & Gourmet Honey
    -- --------------------------------------------------------------------------
    SELECT id INTO v_cat_id FROM "store_categories" WHERE "slug" = 'fresh-grocery-produce' LIMIT 1;
    IF v_cat_id IS NULL THEN
        SELECT id INTO v_cat_id FROM "store_categories" LIMIT 1;
    END IF;

    INSERT INTO "stores" (
        "id", "vendor_profile_id", "store_category_id", "name", "slug", "description",
        "image_url", "logo_url", "address_line", "city", "latitude", "longitude",
        "delivery_radius_km", "base_delivery_fee", "min_order_amount", "timezone",
        "status", "is_active", "is_accepting_orders", "average_rating", "total_reviews",
        "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_vendor_id, v_cat_id, 'Mika Organic Pantry & Gourmet Honey', 'mika-organic-pantry-faisalabad', 'Instagram-acclaimed organic farm collective offering pure Karakoram Sidr honey, stone-ground nut butters, cold-pressed oils, and superfoods.',
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=400&q=80', 'Canal View Commercial Strip, East Canal Road', 'Faisalabad', 31.441, 73.126,
        500, 100, 250, 'Asia/Karachi',
        'APPROVED', true, true, 4.98, 320,
        NOW(), NOW()
    )
    ON CONFLICT ("slug") DO UPDATE SET
        "store_category_id" = EXCLUDED."store_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "image_url" = EXCLUDED."image_url",
        "logo_url" = EXCLUDED."logo_url",
        "address_line" = EXCLUDED."address_line",
        "city" = EXCLUDED."city",
        "latitude" = EXCLUDED."latitude",
        "longitude" = EXCLUDED."longitude",
        "delivery_radius_km" = EXCLUDED."delivery_radius_km",
        "base_delivery_fee" = EXCLUDED."base_delivery_fee",
        "min_order_amount" = EXCLUDED."min_order_amount",
        "status" = 'APPROVED',
        "is_active" = true,
        "is_accepting_orders" = true,
        "average_rating" = EXCLUDED."average_rating",
        "total_reviews" = EXCLUDED."total_reviews",
        "updated_at" = NOW()
    RETURNING "id" INTO v_store_id;

    -- Store Operating Hours (Monday-Sunday 08:00 - 23:30)
    FOR d IN 0..6 LOOP
        INSERT INTO "store_operating_hours" ("id", "store_id", "day_of_week", "opening_time", "closing_time", "is_closed", "created_at", "updated_at")
        VALUES (gen_random_uuid()::text, v_store_id, d, '08:00', '23:30', false, NOW(), NOW())
        ON CONFLICT ("store_id", "day_of_week") DO UPDATE SET
            "opening_time" = EXCLUDED."opening_time",
            "closing_time" = EXCLUDED."closing_time",
            "is_closed" = false,
            "updated_at" = NOW();
    END LOOP;

    -- Product: Wild Karakoram Sidr (Beri) Raw Mountain Honey (500g Hex Jar)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Wild Karakoram Sidr (Beri) Raw Mountain Honey (500g Hex Jar)', 'wild-karakoram-sidr-beri-honey-500g', 'Unheated, unfiltered 100% pure monofloral sidr honey harvested from wild jujube blossoms in high mountain valleys.',
        2600, 60, 'jar', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Stone-Ground 100% Roasted California Almond Butter (300g Jar)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Stone-Ground 100% Roasted California Almond Butter (300g Jar)', 'stone-ground-roasted-almond-butter-300g', 'Single-ingredient creamy nut butter made from slow-roasted nonpareil almonds with no added palm oils or sugars.',
        1950, 45, 'jar', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Virgin Cold-Pressed Raw Organic Coconut Oil (500ml Glass Jar)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Virgin Cold-Pressed Raw Organic Coconut Oil (500ml Glass Jar)', 'virgin-cold-pressed-organic-coconut-oil-500ml', 'Wet-milled from fresh organically grown coconuts. Rich in medium-chain triglycerides (MCT) with a sweet coconut aroma.',
        1450, 55, 'jar', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Slow-Roasted Salted Jumbo Pistachios (250g Vacuum Pouch)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Slow-Roasted Salted Jumbo Pistachios (250g Vacuum Pouch)', 'slow-roasted-salted-jumbo-pistachios-250g', 'Extra-large naturally opened in-shell pistachios lightly dusted with Himalayan pink salt and roasted to crunchy perfection.',
        1800, 50, 'pouch', 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Organic Nutrient-Dense Black Chia Seeds (300g Zip Pouch)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Organic Nutrient-Dense Black Chia Seeds (300g Zip Pouch)', 'organic-nutrient-dense-chia-seeds-300g', 'Superfood packed with dietary fiber, plant protein, and essential omega-3 fatty acids for breakfast puddings and smoothies.',
        850, 70, 'pouch', 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Kashmiri Thin-Shelled Organic Raw Walnuts (500g Pack)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Kashmiri Thin-Shelled Organic Raw Walnuts (500g Pack)', 'kashmiri-thin-shelled-raw-walnuts-500g', 'Light golden walnut halves naturally dried without chemical bleaching. Crisp, buttery, and packed with brain-boosting nutrients.',
        1650, 40, 'pack', 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Organic Pure Moringa Leaf Superfood Powder (150g Jar)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Organic Pure Moringa Leaf Superfood Powder (150g Jar)', 'organic-pure-moringa-leaf-powder-150g', 'Shade-dried drumstick tree leaves milled into fine green powder containing 46 natural antioxidants and 92 nutrients.',
        750, 80, 'jar', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Raw Wildflower Honey Jar with Whole Honeycomb Slice (500g)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Raw Wildflower Honey Jar with Whole Honeycomb Slice (500g)', 'raw-wildflower-honey-with-honeycomb-500g', 'Direct-from-the-hive raw multi-floral honey with an intact chunk of edible golden natural beeswax honeycomb.',
        2900, 35, 'jar', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Whole Golden Organic Flaxseeds Rich in Omega-3 (400g Pouch)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Whole Golden Organic Flaxseeds Rich in Omega-3 (400g Pouch)', 'whole-golden-organic-flaxseeds-400g', 'High-lignan premium golden flaxseeds delivering nutty flavor and supreme digestive wellness benefits.',
        600, 85, 'pouch', 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    -- Product: Sun-Dried Organic Hunza Golden Apricots (500g Pack)
    SELECT id INTO v_prod_cat_id FROM "product_categories" WHERE "slug" = 'pantry-groceries' LIMIT 1;
    IF v_prod_cat_id IS NULL THEN
        SELECT id INTO v_prod_cat_id FROM "product_categories" LIMIT 1;
    END IF;

    INSERT INTO "products" (
        "id", "store_id", "product_category_id", "name", "slug", "description",
        "price", "stock_quantity", "unit", "image_url", "is_active", "created_at", "updated_at"
    )
    VALUES (
        gen_random_uuid()::text, v_store_id, v_prod_cat_id, 'Sun-Dried Organic Hunza Golden Apricots (500g Pack)', 'sun-dried-organic-hunza-apricots-500g', 'Naturally glacier-sun-dried apricots without any sulfur dioxide preservatives. Intense natural caramel sweetness.',
        1200, 65, 'pack', 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80', true, NOW(), NOW()
    )
    ON CONFLICT ("store_id", "slug") DO UPDATE SET
        "product_category_id" = EXCLUDED."product_category_id",
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "price" = EXCLUDED."price",
        "stock_quantity" = EXCLUDED."stock_quantity",
        "unit" = EXCLUDED."unit",
        "image_url" = EXCLUDED."image_url",
        "is_active" = true,
        "updated_at" = NOW();

    RAISE NOTICE '✅ Successfully seeded 12 stores and 120 products in Faisalabad!';
END $$;
