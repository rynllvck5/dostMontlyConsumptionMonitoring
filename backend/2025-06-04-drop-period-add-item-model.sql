-- Migration: Drop 'period' column and add nullable 'item_model' column to consumption_items
ALTER TABLE consumption_items DROP COLUMN IF EXISTS period;
ALTER TABLE consumption_items ADD COLUMN item_model VARCHAR(100) NULL;
