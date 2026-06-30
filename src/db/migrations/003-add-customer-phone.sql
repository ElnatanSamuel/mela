-- Add customer_phone column to orders for loyalty tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);
