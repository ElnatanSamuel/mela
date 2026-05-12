-- Row Level Security Policies for Mela

-- Enable RLS on all tables
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 1. Hotels Policies
CREATE POLICY "Public hotels are viewable by everyone" 
ON hotels FOR SELECT USING (true);

CREATE POLICY "Hotels are manageable by their owners" 
ON hotels FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM hotel_users WHERE hotel_id = hotels.id
));

-- 2. Categories Policies
CREATE POLICY "Categories are viewable by everyone" 
ON categories FOR SELECT USING (true);

CREATE POLICY "Categories are manageable by hotel owners" 
ON categories FOR ALL USING (
    hotel_id IN (SELECT hotel_id FROM hotel_users WHERE user_id = auth.uid())
);

-- 3. Menu Items Policies
CREATE POLICY "Menu items are viewable by everyone" 
ON menu_items FOR SELECT USING (true);

CREATE POLICY "Menu items are manageable by hotel owners" 
ON menu_items FOR ALL USING (
    hotel_id IN (SELECT hotel_id FROM hotel_users WHERE user_id = auth.uid())
);

-- 4. Tables Policies
CREATE POLICY "Tables are viewable by everyone" 
ON tables FOR SELECT USING (true);

CREATE POLICY "Tables are manageable by hotel owners" 
ON tables FOR ALL USING (
    hotel_id IN (SELECT hotel_id FROM hotel_users WHERE user_id = auth.uid())
);

-- 5. Orders Policies
-- Customers can create orders
CREATE POLICY "Anyone can create orders" 
ON orders FOR INSERT WITH CHECK (true);

-- Customers can view their own orders (logic usually handled via app-side tracking, but for DB security:)
-- This might need a more complex session-based approach, but for now:
CREATE POLICY "Orders are viewable by hotel owners" 
ON orders FOR SELECT USING (
    hotel_id IN (SELECT hotel_id FROM hotel_users WHERE user_id = auth.uid())
);

CREATE POLICY "Orders are manageable by hotel owners" 
ON orders FOR UPDATE USING (
    hotel_id IN (SELECT hotel_id FROM hotel_users WHERE user_id = auth.uid())
);

-- 6. Order Items Policies
CREATE POLICY "Anyone can create order items" 
ON order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Order items are viewable by hotel owners" 
ON order_items FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE hotel_id IN (SELECT hotel_id FROM hotel_users WHERE user_id = auth.uid()))
);

-- 7. Transactions Policies
CREATE POLICY "Transactions are viewable by hotel owners" 
ON transactions FOR SELECT USING (
    hotel_id IN (SELECT hotel_id FROM hotel_users WHERE user_id = auth.uid())
);

-- Note: We would need a 'hotel_users' table to link Supabase Auth users to Hotels.
-- Let's add that to the schema in the next step.
