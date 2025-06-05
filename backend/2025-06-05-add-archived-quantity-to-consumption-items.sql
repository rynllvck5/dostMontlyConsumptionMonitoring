-- 2025-06-05-add-archived-quantity-to-consumption-items.sql

ALTER TABLE consumption_items
ADD COLUMN archived_quantity INT DEFAULT 0 NOT NULL;
