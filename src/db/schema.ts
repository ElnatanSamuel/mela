import { pgTable, uuid, text, numeric, boolean, timestamp, integer, pgEnum, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for status tracking
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'preparing', 'served', 'completed', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'partially_paid', 'paid', 'failed']);
export const itemStatusEnum = pgEnum('item_status', ['pending', 'preparing', 'ready', 'served', 'cancelled']);

// 1. Hotels (Tenants)
export const hotels = pgTable('hotels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  clockToken: uuid('clock_token').notNull().defaultRandom().unique(),
  kitchenToken: uuid('kitchen_token').notNull().defaultRandom().unique(),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  location: text('location'),
  phone: text('phone'),
  vatNumber: text('vat_number'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).default('approved').notNull(),
  settings: jsonb('settings').default({ vatRate: 0.15, serviceChargeRate: 0.10, kitchenPin: '1234' }).notNull(),
  subscriptionPlan: text('subscription_plan').default('Standard').notNull(),
  subscriptionPlanId: uuid('subscription_plan_id').references(() => subscriptionPlans.id),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 1.1 Subscription Plans
export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  billingCycle: text('billing_cycle', { enum: ['monthly', 'yearly'] }).default('monthly').notNull(),
  features: jsonb('features').default([]).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Link users (Managers/Staff) to Hotels
export const hotelUsers = pgTable('hotel_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  name: text('name'),
  role: text('role', { enum: ['owner', 'manager', 'waiter', 'chef', 'kitchen', 'biller', 'busboy', 'cleaner', 'platform_admin'] }).default('manager').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_hotel_users_hotel').on(table.hotelId),
  userIdx: index('idx_hotel_users_user').on(table.userId),
}));

// 2. Categories (Food, Drinks, etc.)
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameAm: text('name_am'),
  priority: integer('priority').default(0).notNull(),
}, (table) => ({
  hotelIdx: index('idx_categories_hotel').on(table.hotelId),
}));

// 3. Menu Items
export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameAm: text('name_am'),
  description: text('description'),
  descriptionAm: text('description_am'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true).notNull(),
  isDailySpecial: boolean('is_daily_special').default(false).notNull(),
  isSpicy: boolean('is_spicy').default(false).notNull(),
  isVegetarian: boolean('is_vegetarian').default(false).notNull(),
  hasModifiers: boolean('has_modifiers').default(false).notNull(),
  estimatedPrepTime: integer('estimated_prep_time'),
  tags: text('tags').array(),
  status: text('status', { enum: ['draft', 'published', 'archived'] }).default('published').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_menu_items_hotel').on(table.hotelId),
  categoryIdx: index('idx_menu_items_category').on(table.categoryId),
  availableIdx: index('idx_menu_items_available').on(table.hotelId, table.isAvailable),
}));

// 4. Table Sections (Floor Plan Zones)
export const tableSections = pgTable('table_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  priority: integer('priority').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_table_sections_hotel').on(table.hotelId),
}));

// 5. Tables
export const tables = pgTable('tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  sectionId: uuid('section_id').references(() => tableSections.id, { onDelete: 'set null' }),
  tableNumber: text('table_number').notNull(),
  capacity: integer('capacity').default(4).notNull(),
  status: text('status', { enum: ['free', 'occupied', 'cleaning'] }).default('free').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_tables_hotel').on(table.hotelId),
  sectionIdx: index('idx_tables_section').on(table.sectionId),
}));

// 6. Menu Modifiers (Upselling Options)
export const menuModifiers = pgTable('menu_modifiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameAm: text('name_am'),
  priceModifier: numeric('price_modifier', { precision: 12, scale: 2 }).default('0').notNull(),
  type: text('type', { enum: ['size_upgrade', 'milk_substitute', 'add_shot', 'extra_topping', 'side'] }).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_modifiers_hotel').on(table.hotelId),
  menuItemIdx: index('idx_modifiers_menu_item').on(table.menuItemId),
}));

// 7. Combos (Meal Deals)
export const combos = pgTable('combos', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  nameAm: text('name_am'),
  description: text('description'),
  totalPrice: numeric('total_price', { precision: 12, scale: 2 }).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_combos_hotel').on(table.hotelId),
}));

// 8. Combo Items (Items within a Combo)
export const comboItems = pgTable('combo_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  comboId: uuid('combo_id').references(() => combos.id, { onDelete: 'cascade' }).notNull(),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id, { onDelete: 'cascade' }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
}, (table) => ({
  comboIdx: index('idx_combo_items_combo').on(table.comboId),
}));

// 9. Guest Sessions (Group Cart Sync)
export const guestSessions = pgTable('guest_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  tableId: uuid('table_id').references(() => tables.id, { onDelete: 'cascade' }).notNull(),
  sessionToken: text('session_token').notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tableIdx: index('idx_sessions_table').on(table.tableId),
  tokenIdx: index('idx_sessions_token').on(table.sessionToken),
}));

// 10. Session Cart Items
export const sessionCartItems = pgTable('session_cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => guestSessions.id, { onDelete: 'cascade' }).notNull(),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id).notNull(),
  addedBy: text('added_by').default('guest').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  modifiers: jsonb('modifiers').default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index('idx_session_cart_session').on(table.sessionId),
}));

// 11. Service Requests (Call Waiter / Request Bill)
export const serviceRequests = pgTable('service_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  tableId: uuid('table_id').references(() => tables.id, { onDelete: 'cascade' }).notNull(),
  type: text('type', { enum: ['call_waiter', 'request_bill', 'need_help'] }).notNull(),
  status: text('status', { enum: ['pending', 'acknowledged', 'resolved'] }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_service_requests_hotel').on(table.hotelId),
  statusIdx: index('idx_service_requests_status').on(table.status),
}));

// 12. Orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  tableId: uuid('table_id').references(() => tables.id).notNull(),
  shiftId: uuid('shift_id').references(() => shifts.id, { onDelete: 'set null' }),
  sessionId: uuid('session_id').references(() => guestSessions.id, { onDelete: 'set null' }),
  status: orderStatusEnum('status').default('pending').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('unpaid').notNull(),
  orderType: text('order_type', { enum: ['digital', 'cash'] }).default('digital').notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  vatAmount: numeric('vat_amount', { precision: 12, scale: 2 }).notNull(),
  serviceCharge: numeric('service_charge', { precision: 12, scale: 2 }).notNull(),
  tipAmount: numeric('tip_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  promoCodeId: uuid('promo_code_id').references(() => promoCodes.id, { onDelete: 'set null' }),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_orders_hotel').on(table.hotelId),
  statusIdx: index('idx_orders_status').on(table.status),
  shiftIdx: index('idx_orders_shift').on(table.shiftId),
  tableIdx: index('idx_orders_table').on(table.tableId),
  createdAtIdx: index('idx_orders_created').on(table.createdAt),
}));

// 13. Order Items
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  modifiers: jsonb('modifiers').default([]).notNull(),
  status: itemStatusEnum('status').default('pending').notNull(),
  startTime: timestamp('start_time'),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
}, (table) => ({
  orderIdx: index('idx_order_items_order').on(table.orderId),
}));

// 14. Transactions
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text('payment_method', { enum: ['telebirr', 'cbe_birr', 'chapa', 'cash'] }).notNull(),
  providerReference: text('provider_reference'),
  status: text('status', { enum: ['pending', 'success', 'failed', 'refunded'] }).default('pending').notNull(),
  refundedAt: timestamp('refunded_at'),
  refundReason: text('refund_reason'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('idx_transactions_order').on(table.orderId),
  hotelIdx: index('idx_transactions_hotel').on(table.hotelId),
}));

// 15. Shifts (Daily Shift Closures)
export const shifts = pgTable('shifts', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  openedAt: timestamp('opened_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
  openedBy: uuid('opened_by'),
  closedBy: uuid('closed_by'),
  totalCash: numeric('total_cash', { precision: 12, scale: 2 }).default('0').notNull(),
  totalDigital: numeric('total_digital', { precision: 12, scale: 2 }).default('0').notNull(),
  totalOrders: integer('total_orders').default(0).notNull(),
  cashAtOpen: numeric('cash_at_open', { precision: 12, scale: 2 }).default('0').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_shifts_hotel').on(table.hotelId),
}));

// 16. Promo Codes
export const promoCodes = pgTable('promo_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  code: text('code').notNull(),
  discountType: text('discount_type', { enum: ['percentage', 'fixed'] }).notNull(),
  discountValue: numeric('discount_value', { precision: 12, scale: 2 }).notNull(),
  minOrderAmount: numeric('min_order_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  maxUses: integer('max_uses').default(0).notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  validFrom: timestamp('valid_from').defaultNow().notNull(),
  validUntil: timestamp('valid_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_promo_codes_hotel').on(table.hotelId),
  codeHotelIdx: index('idx_promo_codes_code_hotel').on(table.code, table.hotelId),
}));

// 17. Tips
export const tips = pgTable('tips', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  method: text('method', { enum: ['digital', 'cash'] }).default('digital').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('idx_tips_order').on(table.orderId),
  hotelIdx: index('idx_tips_hotel').on(table.hotelId),
}));

// 18. Staff Attendance
export const staffAttendance = pgTable('staff_attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(),
  name: text('name'),
  clockIn: timestamp('clock_in').defaultNow().notNull(),
  clockOut: timestamp('clock_out'),
  shiftId: uuid('shift_id').references(() => shifts.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_staff_attendance_hotel').on(table.hotelId),
  userIdx: index('idx_staff_attendance_user').on(table.userId),
}));

// 19. Inventory Items
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  stockQuantity: numeric('stock_quantity', { precision: 12, scale: 2 }).default('0').notNull(),
  lowStockThreshold: numeric('low_stock_threshold', { precision: 12, scale: 2 }).default('0').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_inventory_hotel').on(table.hotelId),
}));

// 20. Recipe Ingredients (Links menu items to inventory)
export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id, { onDelete: 'cascade' }).notNull(),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id, { onDelete: 'cascade' }).notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
}, (table) => ({
  menuItemIdx: index('idx_recipe_ingredients_menu_item').on(table.menuItemId),
  inventoryIdx: index('idx_recipe_ingredients_inventory').on(table.inventoryItemId),
}));

// 21. Reservations
export const reservations = pgTable('reservations', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  tableId: uuid('table_id').references(() => tables.id, { onDelete: 'set null' }),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  guestCount: integer('guest_count').notNull(),
  reservationDate: timestamp('reservation_date').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  status: text('status', { enum: ['pending', 'confirmed', 'seated', 'cancelled', 'no_show'] }).default('pending').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_reservations_hotel').on(table.hotelId),
  dateIdx: index('idx_reservations_date').on(table.reservationDate),
  tableIdx: index('idx_reservations_table').on(table.tableId),
}));

// 22. Customer Profiles
export const customerProfiles = pgTable('customer_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  phone: text('phone').notNull(),
  name: text('name'),
  visitCount: integer('visit_count').default(0).notNull(),
  totalSpent: numeric('total_spent', { precision: 12, scale: 2 }).default('0').notNull(),
  lastVisit: timestamp('last_visit'),
  favoriteItems: jsonb('favorite_items').default([]).notNull(),
  loyaltyPoints: integer('loyalty_points').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelPhoneIdx: index('idx_customer_hotel_phone').on(table.hotelId, table.phone),
}));

// 23. Loyalty Transactions
export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => customerProfiles.id, { onDelete: 'cascade' }).notNull(),
  points: integer('points').notNull(),
  type: text('type', { enum: ['earn', 'redeem'] }).notNull(),
  reference: text('reference'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('idx_loyalty_customer').on(table.customerId),
}));

// 24. Menu Versions (Publishing Workflow)
export const menuVersions = pgTable('menu_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  status: text('status', { enum: ['draft', 'published', 'archived'] }).default('draft').notNull(),
  menuData: jsonb('menu_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
}, (table) => ({
  hotelIdx: index('idx_menu_versions_hotel').on(table.hotelId),
}));

// 25. Receipt Settings
export const receiptSettings = pgTable('receipt_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull().unique(),
  headerText: text('header_text').default('Thank you!').notNull(),
  footerText: text('footer_text').default('Visit again!').notNull(),
  showLogo: boolean('show_logo').default(true).notNull(),
  showVat: boolean('show_vat').default(true).notNull(),
  showServiceCharge: boolean('show_service_charge').default(true).notNull(),
  showItemStatus: boolean('show_item_status').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 26. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_audit_logs_hotel').on(table.hotelId),
  actionIdx: index('idx_audit_logs_action').on(table.action),
  createdAtIdx: index('idx_audit_logs_created').on(table.createdAt),
}));

// 27. System Settings (Global Platform Config)
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  platformName: text('platform_name').default('Mela').notNull(),
  supportEmail: text('support_email').default('support@mela.et'),
  supportPhone: text('support_phone').default('+251 900 000 000'),
  currency: text('currency').default('ETB').notNull(),
  trialDays: integer('trial_days').default(14).notNull(),
  maintenanceMode: boolean('maintenance_mode').default(false).notNull(),
  allowSelfOnboarding: boolean('allow_self_onboarding').default(true).notNull(),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  subscriptionPrice: numeric('subscription_price', { precision: 12, scale: 2 }).default('499.00').notNull(),
  subscriptionCycle: text('subscription_cycle').default('monthly').notNull(),
  globalVatRate: numeric('global_vat_rate', { precision: 5, scale: 2 }).default('0.15').notNull(),
  globalServiceCharge: numeric('global_service_charge', { precision: 5, scale: 2 }).default('0.10').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 28. Broadcast Notifications (Platform Admin -> Hotels)
export const broadcastNotifications = pgTable('broadcast_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { enum: ['info', 'alert', 'maintenance'] }).default('info').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
});

// 29. Complaints (Guest feedback / issues)
export const complaints = pgTable('complaints', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id'),
  tableId: uuid('table_id'),
  orderId: uuid('order_id'),
  message: text('message').notNull(),
  status: text('status', { enum: ['new', 'acknowledged', 'resolved'] }).default('new').notNull(),
  response: text('response'),
  respondedBy: uuid('responded_by'),
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_complaints_hotel').on(table.hotelId),
  statusIdx: index('idx_complaints_status').on(table.status),
}));

// 30. Staff Schedules (Expected work hours)
export const staffSchedules = pgTable('staff_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 6=Saturday
  startTime: text('start_time').notNull(), // "08:00"
  endTime: text('end_time').notNull(), // "17:00"
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_staff_schedules_hotel').on(table.hotelId),
  userIdx: index('idx_staff_schedules_user').on(table.userId),
}));

// 31. User Sessions (Active session tracking)
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceInfo: text('device_info'),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_user_sessions_user').on(table.userId),
  hotelIdx: index('idx_user_sessions_hotel').on(table.hotelId),
  tokenIdx: index('idx_user_sessions_token').on(table.token),
  activeIdx: index('idx_user_sessions_active').on(table.isActive),
}));

// 32. Table Assignments (Waiter ↔ Table mapping)
export const tableAssignments = pgTable('table_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  hotelId: uuid('hotel_id').references(() => hotels.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(),
  tableId: uuid('table_id').references(() => tables.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  hotelIdx: index('idx_table_assignments_hotel').on(table.hotelId),
  userIdx: index('idx_table_assignments_user').on(table.userId),
  tableIdx: index('idx_table_assignments_table').on(table.tableId),
}));

// --- Relations ---

export const hotelRelations = relations(hotels, ({ many }) => ({
  categories: many(categories),
  menuItems: many(menuItems),
  tables: many(tables),
  orders: many(orders),
  users: many(hotelUsers),
  sections: many(tableSections),
  modifiers: many(menuModifiers),
  combos: many(combos),
  sessions: many(guestSessions),
  userSessions: many(userSessions),
  tableAssignments: many(tableAssignments),
  complaints: many(complaints),
  staffSchedules: many(staffSchedules),
}));

export const hotelUserRelations = relations(hotelUsers, ({ one }) => ({
  hotel: one(hotels, { fields: [hotelUsers.hotelId], references: [hotels.id] }),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
  hotel: one(hotels, { fields: [categories.hotelId], references: [hotels.id] }),
  menuItems: many(menuItems),
}));

export const menuItemRelations = relations(menuItems, ({ one, many }) => ({
  hotel: one(hotels, { fields: [menuItems.hotelId], references: [hotels.id] }),
  category: one(categories, { fields: [menuItems.categoryId], references: [categories.id] }),
  modifiers: many(menuModifiers),
  comboItems: many(comboItems),
  recipeIngredients: many(recipeIngredients),
}));

export const tableSectionRelations = relations(tableSections, ({ one, many }) => ({
  hotel: one(hotels, { fields: [tableSections.hotelId], references: [hotels.id] }),
  tables: many(tables),
}));

export const tableRelations = relations(tables, ({ one, many }) => ({
  hotel: one(hotels, { fields: [tables.hotelId], references: [hotels.id] }),
  section: one(tableSections, { fields: [tables.sectionId], references: [tableSections.id] }),
  orders: many(orders),
  sessions: many(guestSessions),
  serviceRequests: many(serviceRequests),
  reservations: many(reservations),
}));

export const menuModifierRelations = relations(menuModifiers, ({ one }) => ({
  hotel: one(hotels, { fields: [menuModifiers.hotelId], references: [hotels.id] }),
  menuItem: one(menuItems, { fields: [menuModifiers.menuItemId], references: [menuItems.id] }),
}));

export const comboRelations = relations(combos, ({ one, many }) => ({
  hotel: one(hotels, { fields: [combos.hotelId], references: [hotels.id] }),
  items: many(comboItems),
}));

export const comboItemRelations = relations(comboItems, ({ one }) => ({
  combo: one(combos, { fields: [comboItems.comboId], references: [combos.id] }),
  menuItem: one(menuItems, { fields: [comboItems.menuItemId], references: [menuItems.id] }),
}));

export const guestSessionRelations = relations(guestSessions, ({ one, many }) => ({
  hotel: one(hotels, { fields: [guestSessions.hotelId], references: [hotels.id] }),
  table: one(tables, { fields: [guestSessions.tableId], references: [tables.id] }),
  cartItems: many(sessionCartItems),
}));

export const sessionCartItemRelations = relations(sessionCartItems, ({ one }) => ({
  session: one(guestSessions, { fields: [sessionCartItems.sessionId], references: [guestSessions.id] }),
  menuItem: one(menuItems, { fields: [sessionCartItems.menuItemId], references: [menuItems.id] }),
}));

export const serviceRequestRelations = relations(serviceRequests, ({ one }) => ({
  hotel: one(hotels, { fields: [serviceRequests.hotelId], references: [hotels.id] }),
  table: one(tables, { fields: [serviceRequests.tableId], references: [tables.id] }),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  hotel: one(hotels, { fields: [orders.hotelId], references: [hotels.id] }),
  table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
  shift: one(shifts, { fields: [orders.shiftId], references: [shifts.id] }),
  session: one(guestSessions, { fields: [orders.sessionId], references: [guestSessions.id] }),
  items: many(orderItems),
  transactions: many(transactions),
  promoCode: one(promoCodes, { fields: [orders.promoCodeId], references: [promoCodes.id] }),
  tip: many(tips),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  order: one(orders, { fields: [transactions.orderId], references: [orders.id] }),
  hotel: one(hotels, { fields: [transactions.hotelId], references: [hotels.id] }),
}));

export const shiftRelations = relations(shifts, ({ one, many }) => ({
  hotel: one(hotels, { fields: [shifts.hotelId], references: [hotels.id] }),
  orders: many(orders),
  attendance: many(staffAttendance),
}));

export const promoCodeRelations = relations(promoCodes, ({ one }) => ({
  hotel: one(hotels, { fields: [promoCodes.hotelId], references: [hotels.id] }),
}));

export const tipRelations = relations(tips, ({ one }) => ({
  order: one(orders, { fields: [tips.orderId], references: [orders.id] }),
  hotel: one(hotels, { fields: [tips.hotelId], references: [hotels.id] }),
}));

export const staffAttendanceRelations = relations(staffAttendance, ({ one }) => ({
  hotel: one(hotels, { fields: [staffAttendance.hotelId], references: [hotels.id] }),
  shift: one(shifts, { fields: [staffAttendance.shiftId], references: [shifts.id] }),
}));

export const inventoryItemRelations = relations(inventoryItems, ({ one, many }) => ({
  hotel: one(hotels, { fields: [inventoryItems.hotelId], references: [hotels.id] }),
  recipeIngredients: many(recipeIngredients),
}));

export const recipeIngredientRelations = relations(recipeIngredients, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [recipeIngredients.inventoryItemId], references: [inventoryItems.id] }),
  menuItem: one(menuItems, { fields: [recipeIngredients.menuItemId], references: [menuItems.id] }),
}));

export const reservationRelations = relations(reservations, ({ one }) => ({
  hotel: one(hotels, { fields: [reservations.hotelId], references: [hotels.id] }),
  table: one(tables, { fields: [reservations.tableId], references: [tables.id] }),
}));

export const customerProfileRelations = relations(customerProfiles, ({ one, many }) => ({
  hotel: one(hotels, { fields: [customerProfiles.hotelId], references: [hotels.id] }),
  loyaltyTransactions: many(loyaltyTransactions),
}));

export const loyaltyTransactionRelations = relations(loyaltyTransactions, ({ one }) => ({
  customer: one(customerProfiles, { fields: [loyaltyTransactions.customerId], references: [customerProfiles.id] }),
}));

export const menuVersionRelations = relations(menuVersions, ({ one }) => ({
  hotel: one(hotels, { fields: [menuVersions.hotelId], references: [hotels.id] }),
}));

export const receiptSettingsRelations = relations(receiptSettings, ({ one }) => ({
  hotel: one(hotels, { fields: [receiptSettings.hotelId], references: [hotels.id] }),
}));

export const complaintRelations = relations(complaints, ({ one }) => ({
  hotel: one(hotels, { fields: [complaints.hotelId], references: [hotels.id] }),
}));

export const staffScheduleRelations = relations(staffSchedules, ({ one }) => ({
  hotel: one(hotels, { fields: [staffSchedules.hotelId], references: [hotels.id] }),
}));
