-- Migration: Remove building_account_no and add number_of_occupants to offices table

-- 1. Remove building_account_no column from offices table
ALTER TABLE offices
  DROP COLUMN IF EXISTS building_account_no;

-- 2. Add number_of_occupants column to offices table (accepts only numbers)
ALTER TABLE offices
  ADD COLUMN IF NOT EXISTS number_of_occupants INTEGER; -- Only numeric values allowed

-- Note: If you want to enforce that number_of_occupants is always >= 0, you can add a CHECK constraint:
-- ALTER TABLE offices ADD CONSTRAINT chk_number_of_occupants_nonnegative CHECK (number_of_occupants >= 0);
