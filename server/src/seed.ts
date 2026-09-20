import bcrypt from 'bcrypt';
import { prisma } from './lib/prisma';
import { UserRole, StoreStatus } from '@geomarket/shared';

async function main() {
  console.log('🌱 Starting database seed for GeoMarket...');

  // 1. Store Categories
  const bakeryCat = await prisma.storeCategory.upsert({
    where: { slug: 'bakery-confectionery' },
    update: {},
    create: {
      name: 'Bakery & Confectionery',
      slug: 'bakery-confectionery',
      description: 'Freshly baked artisanal breads, gourmet cakes, and pastries',
      isActive: true,
    },
  });

  const groceryCat = await prisma.storeCategory.upsert({
    where: { slug: 'fresh-grocery-produce' },
    update: {},
    create: {
      name: 'Fresh Grocery & Produce',
      slug: 'fresh-grocery-produce',
      description: 'Farm-fresh vegetables, organic fruits, and daily kitchen staples',
      isActive: true,
    },
  });

  // 2. Product Categories
  const breadCat = await prisma.productCategory.upsert({
    where: { slug: 'artisanal-breads' },
    update: {},
    create: {
      name: 'Artisanal Breads',
      slug: 'artisanal-breads',
      description: 'Handcrafted sourdough, baguettes, and loaves',
    },
  });

  const pastryCat = await prisma.productCategory.upsert({
    where: { slug: 'pastries-cakes' },
    update: {},
    create: {
      name: 'Pastries & Cakes',
      slug: 'pastries-cakes',
      description: 'Croissants, danishes, tarts, and sweet delicacies',
    },
  });

  const fruitCat = await prisma.productCategory.upsert({
    where: { slug: 'fresh-fruits' },
    update: {},
    create: {
      name: 'Fresh Fruits',
      slug: 'fresh-fruits',
      description: 'Locally sourced fresh seasonal fruits',
    },
  });

  const dairyCat = await prisma.productCategory.upsert({
    where: { slug: 'dairy-eggs' },
    update: {},
    create: {
      name: 'Dairy & Eggs',
      slug: 'dairy-eggs',
      description: 'Organic whole milk, cheese, butter, and farm eggs',
    },
  });

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. Admin Account
  const admin = await prisma.user.upsert({
    where: { email: 'admin@geomarket.test' },
    update: { passwordHash },
    create: {
      email: 'admin@geomarket.test',
      passwordHash,
      role: UserRole.ADMIN,
      firstName: 'System',
      lastName: 'Admin',
      phone: '+923000000001',
      isActive: true,
    },
  });

  // 4. Vendor Account
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@geomarket.test' },
    update: { passwordHash },
    create: {
      email: 'vendor@geomarket.test',
      passwordHash,
      role: UserRole.VENDOR,
      firstName: 'Tariq',
      lastName: 'Mahmood',
      phone: '+923001234567',
      isActive: true,
      vendorProfile: {
        create: {
          businessLegalName: 'Artisan Food Concepts PVT LTD',
          taxIdNumber: 'NTN-7890123-4',
          bankAccountInfo: 'PK99MEZN0001234567890123',
        },
      },
    },
    include: { vendorProfile: true },
  });

  let vendorProfile = vendor.vendorProfile;
  if (!vendorProfile) {
    vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId: vendor.id,
        businessLegalName: 'Artisan Food Concepts PVT LTD',
        taxIdNumber: 'NTN-7890123-4',
        bankAccountInfo: 'PK99MEZN0001234567890123',
      },
    });
  }

  // 5. Customer Account
  const customer = await prisma.user.upsert({
    where: { email: 'customer@geomarket.test' },
    update: { passwordHash },
    create: {
      email: 'customer@geomarket.test',
      passwordHash,
      role: UserRole.CUSTOMER,
      firstName: 'Ayesha',
      lastName: 'Khan',
      phone: '+923009876543',
      isActive: true,
    },
  });

  // Default Customer Address in Lahore (Gulberg III)
  await prisma.customerAddress.deleteMany({
    where: { userId: customer.id },
  });

  await prisma.customerAddress.create({
    data: {
      userId: customer.id,
      addressLabel: 'Home',
      recipientName: 'Ayesha Khan',
      recipientPhone: '+923009876543',
      addressLine: '14-L, Mini Market, Gulberg II',
      city: 'Lahore',
      latitude: 31.5204,
      longitude: 74.3587,
      isDefault: true,
    },
  });

  // 6. Store A: Alpha Gourmet Bakery
  const storeA = await prisma.store.upsert({
    where: { slug: 'alpha-gourmet-bakery' },
    update: {
      status: StoreStatus.APPROVED,
      isActive: true,
      isAcceptingOrders: true,
      latitude: 31.5220,
      longitude: 74.3595,
      deliveryRadiusKm: 15,
      baseDeliveryFee: 120,
      minOrderAmount: 250,
    },
    create: {
      vendorProfileId: vendorProfile.id,
      storeCategoryId: bakeryCat.id,
      name: 'Alpha Gourmet Bakery',
      slug: 'alpha-gourmet-bakery',
      description: 'Artisanal French pastries, slow-fermented sourdough, and premium viennoiserie baked fresh daily.',
      addressLine: '22-C Commercial Zone, Gulberg III',
      city: 'Lahore',
      latitude: 31.5220,
      longitude: 74.3595,
      deliveryRadiusKm: 15,
      baseDeliveryFee: 120,
      minOrderAmount: 250,
      status: StoreStatus.APPROVED,
      isActive: true,
      isAcceptingOrders: true,
      timezone: 'Asia/Karachi',
    },
  });

  // Operating hours for Store A (7 days, 08:00 - 22:00)
  await prisma.storeOperatingHours.deleteMany({ where: { storeId: storeA.id } });
  for (let day = 0; day < 7; day++) {
    await prisma.storeOperatingHours.create({
      data: {
        storeId: storeA.id,
        dayOfWeek: day,
        openingTime: '08:00',
        closingTime: '23:00',
        isClosed: false,
      },
    });
  }

  // Products for Store A
  await prisma.product.upsert({
    where: { storeId_slug: { storeId: storeA.id, slug: 'french-sourdough-loaf' } },
    update: { stockQuantity: 15, isActive: true, price: 380 },
    create: {
      storeId: storeA.id,
      productCategoryId: breadCat.id,
      name: 'French Sourdough Loaf',
      slug: 'french-sourdough-loaf',
      description: 'Crispy blistered crust with an airy, tangy crumb made from our 5-year wild sourdough starter.',
      price: 380,
      stockQuantity: 15,
      unit: 'loaf',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=500&q=80',
    },
  });

  await prisma.product.upsert({
    where: { storeId_slug: { storeId: storeA.id, slug: 'almond-butter-croissant' } },
    update: { stockQuantity: 20, isActive: true, price: 240 },
    create: {
      storeId: storeA.id,
      productCategoryId: pastryCat.id,
      name: 'Almond Butter Croissant',
      slug: 'almond-butter-croissant',
      description: 'Double-baked flaky laminated pastry stuffed with rich almond frangipane and toasted sliced almonds.',
      price: 240,
      stockQuantity: 20,
      unit: 'piece',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80',
    },
  });

  await prisma.product.upsert({
    where: { storeId_slug: { storeId: storeA.id, slug: 'belgian-chocolate-eclair' } },
    update: { stockQuantity: 10, isActive: true, price: 190 },
    create: {
      storeId: storeA.id,
      productCategoryId: pastryCat.id,
      name: 'Belgian Chocolate Éclair',
      slug: 'belgian-chocolate-eclair',
      description: 'Crisp choux dough filled with silky Bourbon vanilla pastry cream and dipped in 70% dark Belgian ganache.',
      price: 190,
      stockQuantity: 10,
      unit: 'piece',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=500&q=80',
    },
  });

  // 7. Store B: Beta Fresh Organic Market
  const storeB = await prisma.store.upsert({
    where: { slug: 'beta-fresh-market' },
    update: {
      status: StoreStatus.APPROVED,
      isActive: true,
      isAcceptingOrders: true,
      latitude: 31.5250,
      longitude: 74.3620,
      deliveryRadiusKm: 15,
      baseDeliveryFee: 90,
      minOrderAmount: 200,
    },
    create: {
      vendorProfileId: vendorProfile.id,
      storeCategoryId: groceryCat.id,
      name: 'Beta Fresh Organic Market',
      slug: 'beta-fresh-market',
      description: 'Organic and hydro-farmed vegetables, seasonal fresh fruits, dairy, and artisanal pantry items.',
      addressLine: '58 Mall Road, GOR 1',
      city: 'Lahore',
      latitude: 31.5250,
      longitude: 74.3620,
      deliveryRadiusKm: 15,
      baseDeliveryFee: 90,
      minOrderAmount: 200,
      status: StoreStatus.APPROVED,
      isActive: true,
      isAcceptingOrders: true,
      timezone: 'Asia/Karachi',
    },
  });

  // Operating hours for Store B (7 days, 07:00 - 23:00)
  await prisma.storeOperatingHours.deleteMany({ where: { storeId: storeB.id } });
  for (let day = 0; day < 7; day++) {
    await prisma.storeOperatingHours.create({
      data: {
        storeId: storeB.id,
        dayOfWeek: day,
        openingTime: '07:00',
        closingTime: '23:30',
        isClosed: false,
      },
    });
  }

  // Products for Store B
  await prisma.product.upsert({
    where: { storeId_slug: { storeId: storeB.id, slug: 'organic-honeycrisp-apples' } },
    update: { stockQuantity: 25, isActive: true, price: 320 },
    create: {
      storeId: storeB.id,
      productCategoryId: fruitCat.id,
      name: 'Organic Honeycrisp Apples',
      slug: 'organic-honeycrisp-apples',
      description: 'Crisp, sweet, and juicy orchard-picked certified organic Honeycrisp apples.',
      price: 320,
      stockQuantity: 25,
      unit: 'kg',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=80',
    },
  });

  await prisma.product.upsert({
    where: { storeId_slug: { storeId: storeB.id, slug: 'farm-fresh-whole-milk' } },
    update: { stockQuantity: 30, isActive: true, price: 210 },
    create: {
      storeId: storeB.id,
      productCategoryId: dairyCat.id,
      name: 'Farm Fresh Whole Milk',
      slug: 'farm-fresh-whole-milk',
      description: 'Pure, unhomogenized grass-fed cow milk in recyclable glass bottles.',
      price: 210,
      stockQuantity: 30,
      unit: 'litre',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
    },
  });

  await prisma.product.upsert({
    where: { storeId_slug: { storeId: storeB.id, slug: 'free-range-brown-eggs' } },
    update: { stockQuantity: 20, isActive: true, price: 340 },
    create: {
      storeId: storeB.id,
      productCategoryId: dairyCat.id,
      name: 'Free Range Brown Eggs',
      slug: 'free-range-brown-eggs',
      description: 'Farm-fresh pasture-raised brown eggs with rich golden yolks.',
      price: 340,
      stockQuantity: 20,
      unit: 'dozen',
      isActive: true,
      imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=500&q=80',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Customer: customer@geomarket.test (Password123!)`);
  console.log(`🏪 Store A: Alpha Gourmet Bakery (3 products)`);
  console.log(`🏪 Store B: Beta Fresh Organic Market (3 products)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
