import bcrypt from 'bcrypt';
import { prisma } from './lib/prisma';
import { UserRole, StoreStatus } from '@geomarket/shared';

async function main() {
  console.log('🌱 Starting comprehensive database seed for GeoMarket...');

  // 1. Store Categories
  const storeCategoriesData = [
    {
      name: 'Shopping Malls & Department Stores',
      slug: 'shopping-mall-department',
      description: 'Multi-level retail shopping malls, lifestyle centers, and full-line department stores',
    },
    {
      name: 'Hypermarkets & Superstores',
      slug: 'hypermarket-superstore',
      description: 'Large-scale hypermarkets, wholesale clubs, and all-in-one supercenters',
    },
    {
      name: 'Fresh Grocery & Supermarkets',
      slug: 'fresh-grocery-produce',
      description: 'Farm-fresh produce, imported snacks, organic dairy, and daily household groceries',
    },
    {
      name: 'Bakery & Confectionery',
      slug: 'bakery-confectionery',
      description: 'Artisanal sourdough, French viennoiserie, custom gourmet cakes, and patisserie',
    },
    {
      name: 'Electronics, Tech & Appliances',
      slug: 'electronics-gadgets',
      description: 'Smartphones, laptops, home entertainment, smart kitchen appliances, and audio gear',
    },
    {
      name: 'Fashion, Clothing & Apparel',
      slug: 'fashion-apparel',
      description: 'Designer lawn, luxury stitched suits, formal menswear, streetwear, and footwear',
    },
    {
      name: 'Pharmacy & Personal Care',
      slug: 'pharmacy-health',
      description: 'Prescription wellness, dermatological skincare, vitamins, and hygiene essentials',
    },
  ];

  const storeCatMap: Record<string, string> = {};
  for (const cat of storeCategoriesData) {
    const record = await prisma.storeCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, isActive: true },
      create: { name: cat.name, slug: cat.slug, description: cat.description, isActive: true },
    });
    storeCatMap[cat.slug] = record.id;
  }

  // 2. Product Categories
  const productCategoriesData = [
    { name: 'Smartphones & Audio', slug: 'smartphones-audio', description: 'Flagship mobile phones, earbuds, and wireless headphones' },
    { name: 'Computers & Laptops', slug: 'computers-laptops', description: 'High-performance laptops, ultrabooks, and computer peripherals' },
    { name: 'Home Appliances & Kitchenware', slug: 'home-appliances', description: 'Air fryers, espresso makers, smart TVs, and cookware sets' },
    { name: 'Men\'s Fashion & Footwear', slug: 'mens-fashion', description: 'Formal kurtas, leather shoes, streetwear hoodies, and athletic sneakers' },
    { name: 'Women\'s Fashion & Stitched Suits', slug: 'womens-fashion', description: 'Embroidered silk collections, luxury lawn, and pret wear' },
    { name: 'Fragrances & Luxury Beauty', slug: 'perfumes-cosmetics', description: 'Designer perfumes, anti-aging serums, and makeup palettes' },
    { name: 'Pantry Groceries & Snacks', slug: 'pantry-groceries', description: 'Cooking oils, basmati rice, imported chocolates, and tea' },
    { name: 'Fresh Farm Produce', slug: 'fresh-produce', description: 'Crisp apples, seasonal vegetables, and organic farm greens' },
    { name: 'Butchery & Poultry', slug: 'meat-poultry', description: 'Boneless beef veal, farm broiler chicken, and farm eggs' },
    { name: 'Bakery & Gourmet Deli', slug: 'bakery-desserts', description: 'Artisanal breads, flaky croissants, and deli meats' },
    { name: 'Sports & Fitness Gear', slug: 'sports-fitness', description: 'Tennis rackets, running shoes, cricket bats, and gym gear' },
  ];

  const prodCatMap: Record<string, string> = {};
  for (const cat of productCategoriesData) {
    const record = await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: { name: cat.name, slug: cat.slug, description: cat.description },
    });
    prodCatMap[cat.slug] = record.id;
  }

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. User Accounts
  await prisma.user.upsert({
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
    },
    include: { vendorProfile: true },
  });

  let vendorProfile = vendor.vendorProfile;
  if (!vendorProfile) {
    vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId: vendor.id,
        businessLegalName: 'Lyallpur Premier Retail Concepts PVT LTD',
        taxIdNumber: 'NTN-7890123-4',
        bankAccountInfo: 'PK99MEZN0001234567890123',
      },
    });
  }

  const customersData = [
    { email: 'customer@geomarket.test', firstName: 'Ayesha', lastName: 'Khan', phone: '+923009876543', label: 'Home (Peoples Colony)', address: 'House 14, Main Commercial Boulevard, Peoples Colony No. 1', city: 'Faisalabad', lat: 31.4200, lng: 73.1200 },
    { email: 'hamza.tariq@geomarket.test', firstName: 'Hamza', lastName: 'Tariq', phone: '+923011122334', label: 'Apartment', address: 'Flat 4B, Kohinoor Heights, Jaranwala Road', city: 'Faisalabad', lat: 31.4115, lng: 73.1118 },
    { email: 'fatima.zahra@geomarket.test', firstName: 'Fatima', lastName: 'Zahra', phone: '+923023344556', label: 'Office', address: 'Tech Hub Suite 201, Susan Road, Madina Town', city: 'Faisalabad', lat: 31.4255, lng: 73.1250 },
    { email: 'bilal.ahmed@geomarket.test', firstName: 'Bilal', lastName: 'Ahmed', phone: '+923035566778', label: 'Residence', address: 'House 88, Sector C, Canal View Housing', city: 'Faisalabad', lat: 31.4428, lng: 73.1245 },
    { email: 'zainab.malik@geomarket.test', firstName: 'Zainab', lastName: 'Malik', phone: '+923047788990', label: 'Home', address: 'Villa 12, Gulberg Green Avenue', city: 'Lahore', lat: 31.5204, lng: 74.3587 },
    { email: 'usman.farooq@geomarket.test', firstName: 'Usman', lastName: 'Farooq', phone: '+923059900112', label: 'Home', address: 'Block H, Johar Town Phase 2', city: 'Lahore', lat: 31.4674, lng: 74.2662 },
    { email: 'sana.noor@geomarket.test', firstName: 'Sana', lastName: 'Noor', phone: '+923061122334', label: 'Home', address: 'Street 5, DHA Phase 3 Commercial Area', city: 'Lahore', lat: 31.4740, lng: 74.3570 },
  ];

  const seededCustomers = [];
  for (const c of customersData) {
    const cust = await prisma.user.upsert({
      where: { email: c.email },
      update: { passwordHash, firstName: c.firstName, lastName: c.lastName, phone: c.phone },
      create: {
        email: c.email,
        passwordHash,
        role: UserRole.CUSTOMER,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        isActive: true,
      },
    });

    await prisma.customerAddress.deleteMany({ where: { userId: cust.id } });
    await prisma.customerAddress.create({
      data: {
        userId: cust.id,
        addressLabel: c.label,
        recipientName: `${c.firstName} ${c.lastName}`,
        recipientPhone: c.phone,
        addressLine: c.address,
        city: c.city,
        latitude: c.lat,
        longitude: c.lng,
        isDefault: true,
      },
    });
    seededCustomers.push(cust);
  }

  // 4. Real Shopping Malls & Superstores (500 km Delivery Radius for complete coverage)
  const storesData = [
    {
      name: 'Lyallpur Galleria Mall',
      slug: 'lyallpur-galleria',
      storeCategorySlug: 'shopping-mall-department',
      description: 'Faisalabad\'s flagship luxury shopping and entertainment mall featuring high-end international electronics, designer apparel, fragrances, and premier retail stores.',
      addressLine: 'Canal Road, East Canal Express',
      city: 'Faisalabad',
      latitude: 31.4428,
      longitude: 73.1245,
      deliveryRadiusKm: 500.0,
      baseDeliveryFee: 150,
      minOrderAmount: 500,
      averageRating: 4.9,
      totalReviews: 312,
      products: [
        {
          name: 'Apple iPhone 15 Pro Max (256GB - Natural Titanium)',
          slug: 'apple-iphone-15-pro-max-256gb',
          catSlug: 'smartphones-audio',
          description: 'Forged in titanium with aerospace-grade strength, super-fast A17 Pro chip, customizable Action button, and 5x Telephoto camera.',
          price: 465000,
          stock: 12,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
          slug: 'sony-wh-1000xm5-headphones',
          catSlug: 'smartphones-audio',
          description: 'Industry-leading noise cancelation with two processors and 8 microphones. Ultra-comfortable lightweight design and 30-hour battery life.',
          price: 89500,
          stock: 20,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Khaadi Luxury Embroidered 3-Piece Raw Silk Suit',
          slug: 'khaadi-luxury-embroidered-raw-silk',
          catSlug: 'womens-fashion',
          description: 'Intricately embroidered raw silk shirt paired with matching trousers and a digital-printed organza dupatta with scalloped borders.',
          price: 18990,
          stock: 25,
          unit: 'suit',
          imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Gul Ahmed Premium Men\'s Formal Cotton Kurta Shalwar',
          slug: 'gul-ahmed-mens-formal-kurta-shalwar',
          catSlug: 'mens-fashion',
          description: 'Crafted from 100% long-staple Egyptian cotton with mother-of-pearl buttons and crisp banded collar finish.',
          price: 7850,
          stock: 35,
          unit: 'suit',
          imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Hugo Boss Bottled Eau de Parfum (100ml)',
          slug: 'hugo-boss-bottled-edp-100ml',
          catSlug: 'perfumes-cosmetics',
          description: 'An intense, refined woody-spicy fragrance with notes of crisp apple, warm cardamom, cinnamon, and dark vetiver.',
          price: 28500,
          stock: 18,
          unit: 'bottle',
          imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Dyson Supersonic Hair Dryer (Iron/Fuchsia)',
          slug: 'dyson-supersonic-hair-dryer',
          catSlug: 'home-appliances',
          description: 'Engineered for different hair types with fast drying and intelligent heat control to protect hair from extreme heat damage.',
          price: 125000,
          stock: 8,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
    {
      name: 'Kohinoor 1 Shopping Mall',
      slug: 'kohinoor-1-mall',
      storeCategorySlug: 'shopping-mall-department',
      description: 'Multi-story shopping paradise located in Kohinoor City, known for mobile gadgets, computers, luxury footwear, and ready-to-wear fashion.',
      addressLine: 'Jaranwala Road, Kohinoor City',
      city: 'Faisalabad',
      latitude: 31.4115,
      longitude: 73.1118,
      deliveryRadiusKm: 500.0,
      baseDeliveryFee: 120,
      minOrderAmount: 300,
      averageRating: 4.8,
      totalReviews: 240,
      products: [
        {
          name: 'Samsung Galaxy S24 Ultra (512GB - Titanium Black)',
          slug: 'samsung-galaxy-s24-ultra-512gb',
          catSlug: 'smartphones-audio',
          description: 'Galaxy AI powered flagship with built-in S Pen, 200MP camera, 100x Space Zoom, and Snapdragon 8 Gen 3 processor.',
          price: 399999,
          stock: 10,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Apple MacBook Air M3 (13.6-inch, 16GB RAM, 512GB SSD)',
          slug: 'apple-macbook-air-m3-16gb',
          catSlug: 'computers-laptops',
          description: 'Blazingly fast M3 chip in an impossibly thin fanless design with up to 18 hours of battery life and Liquid Retina display.',
          price: 345000,
          stock: 6,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Logitech MX Master 3S Performance Wireless Mouse',
          slug: 'logitech-mx-master-3s-mouse',
          catSlug: 'computers-laptops',
          description: 'Ergonomic precision mouse with Quiet Clicks, 8,000 DPI track-on-glass sensor, and MagSpeed electromagnetic scrolling.',
          price: 26500,
          stock: 22,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Borjan Pure Handcrafted Leather Peshawari Chappal',
          slug: 'borjan-leather-peshawari-chappal',
          catSlug: 'mens-fashion',
          description: 'Traditional artisanal hand-stitched buffalo leather chappal with tire sole for supreme durability and traditional elegance.',
          price: 6490,
          stock: 30,
          unit: 'pair',
          imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'J. Zarar Gold Pour Homme Luxury Perfume (100ml)',
          slug: 'j-zarar-gold-perfume-100ml',
          catSlug: 'perfumes-cosmetics',
          description: 'A luxurious oriental fragrance opening with sparkling bergamot and mandarin, resting on rich ambergris and sandalwood.',
          price: 8900,
          stock: 40,
          unit: 'bottle',
          imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Anker PowerCore 24,000mAh 65W Fast Power Bank',
          slug: 'anker-powercore-24000mah-65w',
          catSlug: 'smartphones-audio',
          description: 'Ultra-powerful two-way charging power bank equipped with 65W Power Delivery to charge MacBooks and iPhones simultaneously.',
          price: 16800,
          stock: 18,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1609592424300-349896695287?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
    {
      name: 'Al-Fatah Department Store & Supermall',
      slug: 'al-fatah-faisalabad',
      storeCategorySlug: 'hypermarket-superstore',
      description: 'Faisalabad\'s premier superstore on Susan Road offering complete lifestyle shopping: imported pantry delicacies, home electronics, beauty, and fresh groceries.',
      addressLine: 'Susan Road, Madina Town',
      city: 'Faisalabad',
      latitude: 31.4255,
      longitude: 73.1250,
      deliveryRadiusKm: 500.0,
      baseDeliveryFee: 99,
      minOrderAmount: 200,
      averageRating: 4.85,
      totalReviews: 450,
      products: [
        {
          name: 'Nutella Hazelnut Spread with Cocoa (750g Glass Jar)',
          slug: 'nutella-hazelnut-spread-750g',
          catSlug: 'pantry-groceries',
          description: 'Authentic imported Italian hazelnut spread with skim milk and cocoa. Perfect on toast, pancakes, and breakfast croissants.',
          price: 2450,
          stock: 50,
          unit: 'jar',
          imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Ferrero Rocher Fine Hazelnut Chocolates (Box of 24)',
          slug: 'ferrero-rocher-box-24',
          catSlug: 'pantry-groceries',
          description: 'A whole crunchy hazelnut dipped in smooth chocolate cream, enclosed in a crispy wafer shell covered with milk chocolate and roasted nuts.',
          price: 3250,
          stock: 45,
          unit: 'box',
          imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Philips Viva Collection Digital Air Fryer XXL 1.4kg',
          slug: 'philips-digital-air-fryer-xxl',
          catSlug: 'home-appliances',
          description: 'Twin TurboStar technology removes fat from food while frying with little to no added oil. Fits a whole chicken or 1.4kg of fries.',
          price: 44500,
          stock: 12,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'L\'Oréal Paris Revitalift 1.5% Pure Hyaluronic Acid Serum (30ml)',
          slug: 'loreal-revitalift-hyaluronic-acid-serum',
          catSlug: 'perfumes-cosmetics',
          description: 'Dermatologist-validated lightweight anti-aging face serum to intensely hydrate, plump skin, and reduce fine wrinkles.',
          price: 3850,
          stock: 35,
          unit: 'bottle',
          imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Twinings of London Earl Grey Fine Black Tea (100 Bags)',
          slug: 'twinings-earl-grey-tea-100-bags',
          catSlug: 'pantry-groceries',
          description: 'Classic British black tea delicately infused with the natural citrus essence of sunny Mediterranean bergamot oranges.',
          price: 2800,
          stock: 60,
          unit: 'box',
          imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Lindt Excellence 85% Cocoa Dark Chocolate Bar (100g)',
          slug: 'lindt-excellence-85-percent-dark-chocolate',
          catSlug: 'pantry-groceries',
          description: 'Rich, full-bodied Swiss dark chocolate with aromatic roasted cocoa notes and balanced subtle bitterness.',
          price: 1150,
          stock: 75,
          unit: 'bar',
          imageUrl: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
    {
      name: 'Boulevard Mall Faisalabad',
      slug: 'boulevard-mall-faisalabad',
      storeCategorySlug: 'shopping-mall-department',
      description: 'Modern lifestyle shopping destination on Canal Road featuring top tier retail brands, sports gear, home aesthetics, and children\'s amusement.',
      addressLine: 'East Canal Road, Near Citi Housing',
      city: 'Faisalabad',
      latitude: 31.4390,
      longitude: 73.1310,
      deliveryRadiusKm: 500.0,
      baseDeliveryFee: 140,
      minOrderAmount: 400,
      averageRating: 4.75,
      totalReviews: 198,
      products: [
        {
          name: 'Nike Air Zoom Pegasus 40 Men\'s Running Shoes',
          slug: 'nike-air-zoom-pegasus-40',
          catSlug: 'sports-fitness',
          description: 'Responsive cushioning running shoes with dual Zoom Air units and engineered mesh upper for elite breathable performance.',
          price: 38500,
          stock: 15,
          unit: 'pair',
          imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Adidas Tiro 23 League Training Tracksuit (Navy/White)',
          slug: 'adidas-tiro-23-tracksuit',
          catSlug: 'sports-fitness',
          description: 'Moisture-absorbing AEROREADY fabric tracksuit with classic 3-stripes detailing, zip jacket, and tapered athletic pants.',
          price: 19500,
          stock: 20,
          unit: 'set',
          imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Wilson Blade 98 V8 Tennis Racket',
          slug: 'wilson-blade-98-v8-tennis-racket',
          catSlug: 'sports-fitness',
          description: 'Championship-grade tennis racket with FortyFive carbon construction for incredible ball feel and torsional stability.',
          price: 65000,
          stock: 8,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'JBL Flip 6 Portable Waterproof Bluetooth Speaker',
          slug: 'jbl-flip-6-bluetooth-speaker',
          catSlug: 'smartphones-audio',
          description: 'IP67 waterproof and dustproof portable Bluetooth speaker delivering bold JBL Original Pro Sound with up to 12 hours of playtime.',
          price: 32000,
          stock: 14,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Apple iPad 10th Generation (10.9-inch Wi-Fi 64GB)',
          slug: 'apple-ipad-10th-gen-64gb',
          catSlug: 'computers-laptops',
          description: 'All-screen design with 10.9-inch Liquid Retina display, A14 Bionic chip, and 12MP Ultra Wide front camera with Center Stage.',
          price: 128000,
          stock: 10,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Casio G-Shock Carbon Core Guard Watch (Black/Gold)',
          slug: 'casio-g-shock-carbon-core-watch',
          catSlug: 'mens-fashion',
          description: '200M water resistant shock-proof watch with carbon core guard structure, dual LED backlight, and 5 daily alarms.',
          price: 31500,
          stock: 16,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
    {
      name: 'Carrefour Hypermarket - Faisalabad',
      slug: 'carrefour-metro-faisalabad',
      storeCategorySlug: 'hypermarket-superstore',
      description: 'Hypermarket retail giant carrying extensive household appliances, bulk groceries, fresh farm produce, certified halal meat, and bakery.',
      addressLine: 'West Canal Road, University Commercial Town',
      city: 'Faisalabad',
      latitude: 31.4580,
      longitude: 73.0970,
      deliveryRadiusKm: 500.0,
      baseDeliveryFee: 150,
      minOrderAmount: 500,
      averageRating: 4.8,
      totalReviews: 380,
      products: [
        {
          name: 'Samsung 55-inch Crystal 4K UHD Smart TV (CU7000)',
          slug: 'samsung-55-inch-crystal-4k-uhd-tv',
          catSlug: 'home-appliances',
          description: 'PurColor technology for vivid realistic colors, Crystal Processor 4K upscaling, and Smart Hub with Netflix, YouTube, and Apple TV.',
          price: 179000,
          stock: 9,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Haier 1.5 Ton Inverter Air Conditioner (Heat & Cool T3)',
          slug: 'haier-1-5-ton-inverter-ac',
          catSlug: 'home-appliances',
          description: 'A-PAM DC inverter technology with up to 66% energy savings, self-cleaning mechanism, and cooling performance up to 52°C.',
          price: 158000,
          stock: 7,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Guard Supreme Super Basmati Rice (5kg Sealed Bag)',
          slug: 'guard-supreme-basmati-rice-5kg',
          catSlug: 'pantry-groceries',
          description: 'Aged extra-long grain aromatic basmati rice known for its delicate pearl fragrance and fluffy texture upon cooking.',
          price: 2450,
          stock: 65,
          unit: 'bag',
          imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Dalda Premium Canola Oil with Omega 3 & 6 (5 Litre Tin)',
          slug: 'dalda-premium-canola-oil-5l',
          catSlug: 'pantry-groceries',
          description: 'Refined canola cooking oil naturally rich in Omega-3 and Vitamin A, D, and E for healthy heart cholesterol balance.',
          price: 2850,
          stock: 50,
          unit: 'tin',
          imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Prime Halal Boneless Beef Veal Cubes (1kg Fresh Butchery)',
          slug: 'prime-halal-boneless-beef-veal-1kg',
          catSlug: 'meat-poultry',
          description: 'Freshly cut, tender, lean boneless veal cubes hygienically prepped for karahi, nihari, or continental stews.',
          price: 1250,
          stock: 40,
          unit: 'kg',
          imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Farm-Fresh Whole Broiler Chicken (Cleaned & Dressed 1.2kg)',
          slug: 'farm-fresh-whole-broiler-chicken-1-2kg',
          catSlug: 'meat-poultry',
          description: '100% halal grain-fed young chicken, thoroughly washed, skinless, cut into standard 12-curry pieces.',
          price: 680,
          stock: 60,
          unit: 'pack',
          imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
    {
      name: 'Chase Up Department Store & Mall',
      slug: 'chase-up-faisalabad',
      storeCategorySlug: 'hypermarket-superstore',
      description: 'Famous nationwide department store chain providing unbeatable value across groceries, stitched garments, crockery, and home linens.',
      addressLine: 'Main Satiana Road, Near D Ground',
      city: 'Faisalabad',
      latitude: 31.4080,
      longitude: 73.1040,
      deliveryRadiusKm: 500.0,
      baseDeliveryFee: 100,
      minOrderAmount: 250,
      averageRating: 4.7,
      totalReviews: 320,
      products: [
        {
          name: 'Shan Special Bombay Biryani Masala (Pack of 6 Boxes)',
          slug: 'shan-bombay-biryani-masala-6pack',
          catSlug: 'pantry-groceries',
          description: 'Authentic blend of aromatic spices and whole dried plums to recreate restaurant-style aromatic spiced biryani.',
          price: 780,
          stock: 80,
          unit: 'pack',
          imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Olper\'s Full Cream Homogenized UHT Milk (1L x 12 Pack Carton)',
          slug: 'olpers-full-cream-milk-12pack-carton',
          catSlug: 'pantry-groceries',
          description: '100% pure nutritious farm milk processed through ultra-high temperature (UHT) packaging with zero preservatives.',
          price: 3450,
          stock: 30,
          unit: 'carton',
          imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Sonex Die-Cast Non-Stick 9-Piece Cookware Set with Glass Lids',
          slug: 'sonex-die-cast-cookware-9piece',
          catSlug: 'home-appliances',
          description: 'Heavy gauge aluminum body with marble non-stick coating, tempered glass steam-vent lids, and heat-resistant soft-touch handles.',
          price: 19800,
          stock: 14,
          unit: 'set',
          imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'ChenOne Luxury King Size Embroidered Cotton Bed Sheet Set',
          slug: 'chenone-king-size-embroidered-bed-sheet',
          catSlug: 'womens-fashion',
          description: '300-thread-count 100% percale cotton sheet set including 1 king flat sheet and 2 decorative Oxford embroidered pillow shams.',
          price: 7500,
          stock: 22,
          unit: 'set',
          imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Dettol Anti-Bacterial Original Body Wash (500ml)',
          slug: 'dettol-anti-bacterial-body-wash-500ml',
          catSlug: 'perfumes-cosmetics',
          description: 'Formulated with pine fragrance and advanced germ-protection formula to keep skin refreshingly cleansed and moisturized.',
          price: 1150,
          stock: 55,
          unit: 'bottle',
          imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'National Tomato Ketchup Value Pouch (800g)',
          slug: 'national-tomato-ketchup-800g',
          catSlug: 'pantry-groceries',
          description: 'Made from sun-ripened red tomatoes with a tangy sweet blend of natural vinegar and spices. Convenient pour pouch.',
          price: 540,
          stock: 70,
          unit: 'pouch',
          imageUrl: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
    {
      name: 'Jalal Sons Gourmet & Supermarket',
      slug: 'jalal-sons-faisalabad',
      storeCategorySlug: 'fresh-grocery-produce',
      description: 'Legendary gourmet food emporium in Peoples Colony offering live artisan bakery, imported European deli cheeses, salads, and luxury groceries.',
      addressLine: 'D Ground Commercial Area, Peoples Colony No. 1',
      city: 'Faisalabad',
      latitude: 31.4130,
      longitude: 73.1090,
      deliveryRadiusKm: 500.0,
      baseDeliveryFee: 120,
      minOrderAmount: 300,
      averageRating: 4.95,
      totalReviews: 520,
      products: [
        {
          name: 'Jalal Sons Signature Red Velvet Fudge Cake (2 Lbs)',
          slug: 'jalal-sons-signature-red-velvet-cake-2lb',
          catSlug: 'bakery-desserts',
          description: 'Moist crimson sponge layers filled with silky Madagascar vanilla cream cheese frosting and dusted with fine red velvet crumbs.',
          price: 2400,
          stock: 18,
          unit: 'cake',
          imageUrl: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Smoked Turkey Breast Gourmet Deli Slices (250g Pack)',
          slug: 'smoked-turkey-breast-deli-slices-250g',
          catSlug: 'bakery-desserts',
          description: 'Slow-smoked over hickory hardwood with natural herbs. Pre-sliced for artisan charcuterie boards and gourmet club sandwiches.',
          price: 1650,
          stock: 25,
          unit: 'pack',
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Imported Danish Blue Cheese Wedge (200g)',
          slug: 'imported-danish-blue-cheese-200g',
          catSlug: 'bakery-desserts',
          description: 'Traditional creamy semi-soft blue-veined cow\'s milk cheese with a sharp, salty piquant profile and smooth buttery finish.',
          price: 1450,
          stock: 30,
          unit: 'wedge',
          imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Artisanal French Butter Croissant (Box of 4)',
          slug: 'artisanal-french-butter-croissant-box4',
          catSlug: 'bakery-desserts',
          description: 'Double-laminated golden honeycomb croissants made with 100% French butter. Light, flaky, and baked fresh every morning.',
          price: 980,
          stock: 40,
          unit: 'box',
          imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Organic Farm Fresh Golden Eggplant & Roma Tomatoes Basket (3kg)',
          slug: 'organic-eggplant-roma-tomatoes-basket-3kg',
          catSlug: 'fresh-produce',
          description: 'Hand-picked organic glossy purple eggplants and firm red vine tomatoes packed in a ventilated farm crate.',
          price: 650,
          stock: 35,
          unit: 'basket',
          imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'San Pellegrino Sparkling Natural Mineral Water (750ml Glass)',
          slug: 'san-pellegrino-sparkling-water-750ml',
          catSlug: 'pantry-groceries',
          description: 'Bottled at the natural spring in Val Brembana, Italian Alps. Crisp effervescence with signature mineral mouthfeel.',
          price: 750,
          stock: 48,
          unit: 'bottle',
          imageUrl: 'https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
    {
      name: 'Emporium Mega Mall',
      slug: 'emporium-mall',
      storeCategorySlug: 'shopping-mall-department',
      description: 'One of Pakistan\'s premier mega malls, housing over 200 global fashion boutiques, electronics showrooms, and luxury department stores within regional reach.',
      addressLine: 'Abdul Haque Road, Commercial Zone, Johar Town',
      city: 'Lahore',
      latitude: 31.4674,
      longitude: 74.2662,
      deliveryRadiusKm: 500.0,
      baseDeliveryFee: 290,
      minOrderAmount: 1000,
      averageRating: 4.9,
      totalReviews: 680,
      products: [
        {
          name: 'Sony PlayStation 5 Slim Digital Edition (1TB SSD)',
          slug: 'sony-playstation-5-slim-1tb',
          catSlug: 'smartphones-audio',
          description: 'Next-gen gaming power with ultra-high speed SSD, ray tracing graphics, 4K-TV gaming at up to 120fps, and Tempest 3D AudioTech.',
          price: 165000,
          stock: 8,
          unit: 'console',
          imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Bose QuietComfort 45 Wireless Noise-Cancelling Headphones',
          slug: 'bose-quietcomfort-45-headphones',
          catSlug: 'smartphones-audio',
          description: 'Iconic acoustic noise cancelation with Aware Mode, lightweight plush synthetic leather cushions, and 24 hours of listening.',
          price: 82000,
          stock: 15,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Nishat Linen Festive Embroidered Silk Chiffon Collection',
          slug: 'nishat-linen-festive-embroidered-silk',
          catSlug: 'womens-fashion',
          description: 'Opulent festive unstitched 3-piece suit featuring heavy zari embroidery on pure chiffon with raw silk trousers.',
          price: 16500,
          stock: 24,
          unit: 'suit',
          imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'TAG Heuer Formula 1 Quartz Chronograph 43mm Watch',
          slug: 'tag-heuer-formula-1-chronograph-43mm',
          catSlug: 'mens-fashion',
          description: 'Swiss-made luxury motor racing watch with fine-brushed stainless steel case, black tachymeter bezel, and sapphire crystal.',
          price: 490000,
          stock: 4,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'De\'Longhi Magnifica S Automatic Espresso Bean-to-Cup Machine',
          slug: 'delonghi-magnifica-s-espresso-machine',
          catSlug: 'home-appliances',
          description: 'Compact bean-to-cup machine with integrated grinder, traditional milk frother, and customizable coffee intensity.',
          price: 195000,
          stock: 5,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Chanel Coco Mademoiselle Eau de Parfum (100ml)',
          slug: 'chanel-coco-mademoiselle-edp-100ml',
          catSlug: 'perfumes-cosmetics',
          description: 'An ambery, oriental women\'s fragrance with fresh citrus top notes of Sicilian orange and clear accents of Grasse rose and patchouli.',
          price: 62000,
          stock: 12,
          unit: 'bottle',
          imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
    {
      name: 'Packages Mall Super-Regional Center',
      slug: 'packages-mall',
      storeCategorySlug: 'shopping-mall-department',
      description: 'Modern world-class shopping center built across 30 acres featuring hypermarkets, cinema halls, Apple megastores, and flagship sports brands.',
      addressLine: 'Walton Road, Near DHA Phase 3 Commercial Area',
      city: 'Lahore',
      latitude: 31.4740,
      longitude: 74.3570,
      deliveryRadiusKm: 500.0,
      baseDeliveryFee: 290,
      minOrderAmount: 1000,
      averageRating: 4.88,
      totalReviews: 540,
      products: [
        {
          name: 'Apple Watch Ultra 2 (GPS + Cellular, 49mm Titanium)',
          slug: 'apple-watch-ultra-2-49mm-titanium',
          catSlug: 'smartphones-audio',
          description: 'The most rugged and capable Apple Watch. Aerospace-grade titanium case, precision dual-frequency GPS, and up to 36 hours of battery.',
          price: 255000,
          stock: 9,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'LG 65-inch OLED evo C3 4K Smart Cinema Television',
          slug: 'lg-65-inch-oled-evo-c3-4k-tv',
          catSlug: 'home-appliances',
          description: 'Self-lit OLED pixels delivering infinite contrast, Brightness Booster, α9 AI Processor Gen6, Dolby Vision IQ, and Dolby Atmos.',
          price: 485000,
          stock: 4,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Under Armour Men\'s Project Rock 5 Training Shoes',
          slug: 'under-armour-project-rock-5',
          catSlug: 'sports-fitness',
          description: 'Engineered mesh upper with responsive UA HOVR cushioning to eliminate impact and molded TPU strap for ultimate lateral stability.',
          price: 36000,
          stock: 16,
          unit: 'pair',
          imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Tissot PRX Powermatic 80 Automatic 40mm Steel Watch',
          slug: 'tissot-prx-powermatic-80-automatic',
          catSlug: 'mens-fashion',
          description: 'Integrated 1970s bracelet watch with textured blue waffle dial, Nivachron balance spring, and 80-hour power reserve.',
          price: 210000,
          stock: 7,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'Marshall Stanmore III Bluetooth Home Speaker (Black)',
          slug: 'marshall-stanmore-iii-bluetooth-speaker',
          catSlug: 'smartphones-audio',
          description: 'Legendary Marshall vintage rock styling with wider stereo soundstage, dynamic loudness control, and next-generation Bluetooth 5.2.',
          price: 108000,
          stock: 11,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
        },
        {
          name: 'CA Plus 15000 English Willow Player Edition Cricket Bat',
          slug: 'ca-plus-15000-cricket-bat',
          catSlug: 'sports-fitness',
          description: 'Expertly handcrafted Grade 1 English Willow cricket bat with 38-40mm massive edges, superb balance, and embossed chrome grip.',
          price: 48000,
          stock: 12,
          unit: 'piece',
          imageUrl: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=600&q=80',
        },
      ],
    },
  ];

  for (const s of storesData) {
    const catId = storeCatMap[s.storeCategorySlug];
    if (!catId) continue;

    console.log(`  🏪 Seeding: ${s.name} (${s.city}) with ${s.deliveryRadiusKm}km delivery radius...`);

    const store = await prisma.store.upsert({
      where: { slug: s.slug },
      update: {
        vendorProfileId: vendorProfile.id,
        storeCategoryId: catId,
        name: s.name,
        description: s.description,
        addressLine: s.addressLine,
        city: s.city,
        latitude: s.latitude,
        longitude: s.longitude,
        deliveryRadiusKm: s.deliveryRadiusKm,
        baseDeliveryFee: s.baseDeliveryFee,
        minOrderAmount: s.minOrderAmount,
        status: StoreStatus.APPROVED,
        isActive: true,
        isAcceptingOrders: true,
        timezone: 'Asia/Karachi',
        averageRating: s.averageRating,
        totalReviews: s.totalReviews,
      },
      create: {
        vendorProfileId: vendorProfile.id,
        storeCategoryId: catId,
        name: s.name,
        slug: s.slug,
        description: s.description,
        addressLine: s.addressLine,
        city: s.city,
        latitude: s.latitude,
        longitude: s.longitude,
        deliveryRadiusKm: s.deliveryRadiusKm,
        baseDeliveryFee: s.baseDeliveryFee,
        minOrderAmount: s.minOrderAmount,
        status: StoreStatus.APPROVED,
        isActive: true,
        isAcceptingOrders: true,
        timezone: 'Asia/Karachi',
        averageRating: s.averageRating,
        totalReviews: s.totalReviews,
      },
    });

    // 7-day Operating Hours (08:00 - 23:30) so all stores are always open
    await prisma.storeOperatingHours.deleteMany({ where: { storeId: store.id } });
    for (let day = 0; day < 7; day++) {
      await prisma.storeOperatingHours.create({
        data: {
          storeId: store.id,
          dayOfWeek: day,
          openingTime: '08:00',
          closingTime: '23:30',
          isClosed: false,
        },
      });
    }

    // Insert all Products for this store
    for (const p of s.products) {
      const prodCatId = prodCatMap[p.catSlug] || Object.values(prodCatMap)[0];
      await prisma.product.upsert({
        where: { storeId_slug: { storeId: store.id, slug: p.slug } },
        update: {
          productCategoryId: prodCatId,
          name: p.name,
          description: p.description,
          price: p.price,
          stockQuantity: p.stock,
          unit: p.unit,
          imageUrl: p.imageUrl,
          isActive: true,
        },
        create: {
          storeId: store.id,
          productCategoryId: prodCatId,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          stockQuantity: p.stock,
          unit: p.unit,
          imageUrl: p.imageUrl,
          isActive: true,
        },
      });
    }

    // Seed delivered orders and genuine customer reviews for this store
    const storeProducts = await prisma.product.findMany({ where: { storeId: store.id, isActive: true } });
    
    // Clean existing seed reviews and orders for this store
    await prisma.review.deleteMany({ where: { storeId: store.id } });

    const reviewSamples = [
      { rating: 5, comment: `Ordered from ${s.name} and it arrived in under 25 minutes! Extremely fresh items and high quality packaging.` },
      { rating: 5, comment: `100% authentic products. The courier was polite and gave exact change for Cash on Delivery.` },
      { rating: 5, comment: `Super reliable merchant on GeoMarket. Everything ordered matched the exact specifications.` },
      { rating: 4, comment: `Great quality and very fast dispatch. Will definitely be a regular customer.` },
      { rating: 5, comment: `Carefully packaged and sealed. Very happy with the prompt fulfillment!` },
    ];

    const reviewCountToSeed = Math.min(seededCustomers.length, reviewSamples.length);
    for (let i = 0; i < reviewCountToSeed; i++) {
      const cust = seededCustomers[i];
      const revSample = reviewSamples[i];
      const prod1 = storeProducts[i % storeProducts.length];
      const prod2 = storeProducts[(i + 1) % storeProducts.length];

      if (!prod1) continue;

      const item1Price = Number(prod1.price);
      const item2Price = prod2 ? Number(prod2.price) : 0;
      const subtotal = item1Price + item2Price;
      const deliveryFee = Number(s.baseDeliveryFee);
      const totalAmount = subtotal + deliveryFee;

      const order = await prisma.order.create({
        data: {
          userId: cust.id,
          storeId: store.id,
          status: 'DELIVERED',
          paymentMethod: 'COD',
          paymentStatus: 'PAID',
          subtotal,
          deliveryFee,
          totalAmount,
          createdAt: new Date(Date.now() - (i + 1) * 86400000 * 2),
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: prod1.id,
          productNameSnapshot: prod1.name,
          unitPriceSnapshot: prod1.price,
          quantity: 1,
          lineTotal: prod1.price,
        },
      });

      if (prod2) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: prod2.id,
            productNameSnapshot: prod2.name,
            unitPriceSnapshot: prod2.price,
            quantity: 1,
            lineTotal: prod2.price,
          },
        });
      }

      await prisma.orderAddressSnapshot.create({
        data: {
          orderId: order.id,
          recipientName: `${cust.firstName} ${cust.lastName}`,
          recipientPhone: cust.phone,
          address: `${s.city} Delivery Address, Sector ${i + 1}`,
          city: s.city,
          latitude: s.latitude,
          longitude: s.longitude,
        },
      });

      await prisma.review.create({
        data: {
          orderId: order.id,
          userId: cust.id,
          storeId: store.id,
          rating: revSample.rating,
          comment: revSample.comment,
          createdAt: new Date(Date.now() - (i + 1) * 86400000 * 2 + 3600000),
        },
      });
    }

    const reviews = await prisma.review.findMany({ where: { storeId: store.id } });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) * 100) / 100
      : 0;

    await prisma.store.update({
      where: { id: store.id },
      data: {
        totalReviews,
        averageRating,
      },
    });
  }

  console.log('✅ Database seeded successfully with verified customer reviews, accurate ratings, and multi-category products!');
  console.log('📍 Reference Coordinates: (31.4200, 73.1200) Peoples Colony, Faisalabad');
  console.log('👤 Customer: customer@geomarket.test (Password123!)');
  console.log('🏪 Total Real Shopping Malls / Superstores Seeded: 9');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
