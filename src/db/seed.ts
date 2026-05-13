import { db } from './index';
import { hotels, categories, menuItems, tables, hotelUsers } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Create a Demo Hotel
    const [hotel] = await db.insert(hotels).values({
      name: 'Habesha Palace',
      slug: 'habesha-palace',
      location: 'Bole, Addis Ababa',
      phone: '+251911000000',
    }).returning();

    console.log('✅ Created Hotel:', hotel.name);

    // 2. Create Categories
    const [cat1] = await db.insert(categories).values({
      hotelId: hotel.id,
      name: 'Main Dishes',
      nameAm: 'ዋና ምግቦች',
      priority: 1,
    }).returning();

    const [cat2] = await db.insert(categories).values({
      hotelId: hotel.id,
      name: 'Drinks',
      nameAm: 'መጠጦች',
      priority: 2,
    }).returning();

    // 3. Create Menu Items
    await db.insert(menuItems).values([
      {
        hotelId: hotel.id,
        categoryId: cat1.id,
        name: 'Special Kitfo',
        nameAm: 'ልዩ ክትፎ',
        description: 'Traditional minced beef with spiced butter and ayib.',
        price: '450.00',
        isDailySpecial: true,
        isSpicy: true,
      },
      {
        hotelId: hotel.id,
        categoryId: cat1.id,
        name: 'Doro Wat',
        nameAm: 'ዶሮ ወጥ',
        description: 'Traditional chicken stew with boiled eggs.',
        price: '550.00',
        isSpicy: true,
      },
      {
        hotelId: hotel.id,
        categoryId: cat2.id,
        name: 'Tej (Large)',
        nameAm: 'ጠጅ (ትልቅ)',
        description: 'Traditional honey wine.',
        price: '120.00',
      },
    ]);

    // 4. Create Tables
    await db.insert(tables).values([
      { hotelId: hotel.id, tableNumber: '1' },
      { hotelId: hotel.id, tableNumber: '2' },
      { hotelId: hotel.id, tableNumber: 'VIP-1' },
    ]);

    console.log('✅ Created Menu & Tables');

    console.log('\n--- 🔑 ACCOUNT SETUP GUIDE ---');
    console.log('1. Go to Supabase Dashboard > Authentication');
    console.log('2. Create 3 users with any password:');
    console.log('   - admin@mela.com (System Admin)');
    console.log('   - manager@hotel.com (Hotel Manager)');
    console.log('   - staff@hotel.com (Waiter)');
    console.log('\n3. Copy their User IDs and link them manually for now.');
    console.log('-------------------------------\n');

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
