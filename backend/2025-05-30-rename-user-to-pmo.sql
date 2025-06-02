-- Migration: Rename 'user' role to 'pmo' and update constraint

-- Update all users with role 'user' to 'pmo'
UPDATE users SET role = 'pmo' WHERE role = 'user';

-- Update the CHECK constraint on the role column
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%IN%';
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name);
    END IF;
END$$;

ALTER TABLE users
    ADD CONSTRAINT users_role_check CHECK (role IN ('superadmin', 'admin', 'pmo'));
