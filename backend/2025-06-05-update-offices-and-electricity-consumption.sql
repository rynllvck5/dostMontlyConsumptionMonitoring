-- Migration script to alter tables: electricity_consumption and offices
-- Adds new fields as requested

-- 1. Alter electricity_consumption table
ALTER TABLE electricity_consumption
    ADD COLUMN building_description VARCHAR(255),
    ADD COLUMN gross_area DECIMAL(10,2),
    ADD COLUMN air_conditioned_area DECIMAL(10,2),
    ADD COLUMN number_of_occupants INT,
    ADD COLUMN office_account_no VARCHAR(100),
    ADD COLUMN office_address VARCHAR(255);

-- 2. Alter offices table
ALTER TABLE offices
    ADD COLUMN office_address VARCHAR(255);
