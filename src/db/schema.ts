import { pgTable, uuid, text, numeric, boolean, timestamp, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for status tracking
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'preparing', 'served', 'completed', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'partially_paid', 'paid', 'failed']);

// 1. Hotels (Tenants)
export const hotels = pgTable('hotels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  location: text('location'),
  phone: text('phone'),
  vatNumber: text('vat_number'),
  settings: jsonb('settings').default({ vatRate: 0.15, serviceChargeRate: 0.10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Link users (Managers/Staff) to Hotels
export const hotelUsers = pgTable('hotel_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }), // Nullable for platform_admin
  userId: uuid('user_id').notNull(), // Links to auth.users.id in Supabase
  role: text('role', { enum: ['owner', 'manager', 'waiter', 'platform_admin'] }).default('manager').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Categories (Food, Drinks, etc.)
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameAm: text('name_am'), // Amharic name
  priority: integer('priority').default(0).notNull(),
});

// 3. Menu Items
export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameAm: text('name_am'), // Amharic name
  description: text('description'),
  descriptionAm: text('description_am'), // Amharic description
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true).notNull(),
  isDailySpecial: boolean('is_daily_special').default(false).notNull(),
  isSpicy: boolean('is_spicy').default(false).notNull(),
  isVegetarian: boolean('is_vegetarian').default(false).notNull(), // Critical for fasting days
  estimatedPrepTime: integer('estimated_prep_time'), // in minutes
  tags: text('tags').array(), // ['Chef Choice', 'New', 'Bestseller']
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Tables
export const tables = pgTable('tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  tableNumber: text('table_number').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  tableId: uuid('table_id').references(() => tables.id).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('unpaid').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  vatAmount: numeric('vat_amount', { precision: 12, scale: 2 }).notNull(),
  serviceCharge: numeric('service_charge', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Order Items
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
});

// 7. Transactions
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(), // 'telebirr', 'cbe_birr', 'chapa', 'cash'
  providerReference: text('provider_reference'), // External ID from payment gateway
  status: text('status').default('pending').notNull(), // 'pending', 'success', 'failed'
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Relations ---

export const hotelRelations = relations(hotels, ({ many }) => ({
  categories: many(categories),
  menuItems: many(menuItems),
  tables: many(tables),
  orders: many(orders),
  users: many(hotelUsers),
}));

export const hotelUserRelations = relations(hotelUsers, ({ one }) => ({
  hotel: one(hotels, { fields: [hotelUsers.hotelId], references: [hotels.id] }),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
  hotel: one(hotels, { fields: [categories.hotelId], references: [hotels.id] }),
  menuItems: many(menuItems),
}));

export const menuItemRelations = relations(menuItems, ({ one }) => ({
  hotel: one(hotels, { fields: [menuItems.hotelId], references: [hotels.id] }),
  category: one(categories, { fields: [menuItems.categoryId], references: [categories.id] }),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  hotel: one(hotels, { fields: [orders.hotelId], references: [hotels.id] }),
  table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
  items: many(orderItems),
  transactions: many(transactions),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  order: one(orders, { fields: [transactions.orderId], references: [orders.id] }),
  hotel: one(hotels, { fields: [transactions.hotelId], references: [hotels.id] }),
}));

// 8. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id'),
  action: text('action').notNull(), // 'CREATE_ITEM', 'UPDATE_PRICE', 'DELETE_CATEGORY'
  entityType: text('entity_type').notNull(), // 'menu_item', 'category', 'order'
  entityId: uuid('entity_id').notNull(),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
