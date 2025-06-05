-- Migration: Add archived column to consumption_items
ALTER TABLE consumption_items ADD COLUMN archived BOOLEAN DEFAULT FALSE;
