-- Migration Script: Add Inventory System for Electric-Consuming Items
-- Run this script on your dost_monthly_consumption_monitoring database

-- 1. Create the consumption_items table
CREATE TABLE IF NOT EXISTS consumption_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    item_name VARCHAR(100) NOT NULL,
    kilowatts DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    period VARCHAR(20) DEFAULT 'per hour',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create the item_images table
CREATE TABLE IF NOT EXISTS item_images (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES consumption_items(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. (Optional) Add image_url column to consumption_items
ALTER TABLE consumption_items
ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);

COMMENT ON COLUMN consumption_items.image_url IS 'URL or path to the item image';

-- 4. (Optional) Ensure quantity and period columns exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='consumption_items' AND column_name='quantity'
    ) THEN
        ALTER TABLE consumption_items ADD COLUMN quantity INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='consumption_items' AND column_name='period'
    ) THEN
        ALTER TABLE consumption_items ADD COLUMN period VARCHAR(20) DEFAULT 'per hour';
    END IF;
END$$;
