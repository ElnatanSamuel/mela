import { db } from './index';
import { hotels, categories, menuItems, tables } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create a Hotel
  const [hotel] = await db.insert(hotels).values({
    name: 'Habesha Palace',
    slug: 'habesha-palace',
    location: 'Bole, Addis Ababa',
    phone: '+251911000000',
    settings: { vatRate: 0.15, serviceChargeRate: 0.10 },
  }).returning();

  // 2. Create Categories
  const [foodCat] = await db.insert(categories).values({
    hotelId: hotel.id,
    name: 'Main Dishes',
    nameAm: 'ዋና ምግቦች',
    priority: 1,
  }).returning();

  const [drinksCat] = await db.insert(categories).values({
    hotelId: hotel.id,
    name: 'Drinks',
    nameAm: 'መጠጦች',
    priority: 2,
  }).returning();

  // 3. Create Menu Items
  await db.insert(menuItems).values([
    {
      hotelId: hotel.id,
      categoryId: foodCat.id,
      name: 'Special Beyaynetu',
      nameAm: 'ልዩ በያይነቱ',
      description: 'A traditional platter with various lentil and vegetable stews.',
      descriptionAm: 'የተለያዩ የምስር እና የአትክልት ወጥዎች ያሉበት የሀበሻ በያይነቱ።',
      price: '350.00',
      isAvailable: true,
    },
    {
      hotelId: hotel.id,
      categoryId: foodCat.id,
      name: 'Doro Wat',
      nameAm: 'ዶሮ ወጥ',
      description: 'Traditional Ethiopian chicken stew with boiled eggs.',
      descriptionAm: 'የሀበሻ ባህላዊ የዶሮ ወጥ ከእንቁላል ጋር።',
      price: '550.00',
      isAvailable: true,
    },
    {
      hotelId: hotel.id,
      categoryId: drinksCat.id,
      name: 'Habesha Beer',
      nameAm: 'ሀበሻ ቢራ',
      price: '80.00',
      isAvailable: true,
    }
  ]);

  // 4. Create Tables
  await db.insert(tables).values([
    { hotelId: hotel.id, tableNumber: '1' },
    { hotelId: hotel.id, tableNumber: '2' },
    { hotelId: hotel.id, tableNumber: 'VIP-1' },
  ]);

  console.log('✅ Seeding complete!');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
