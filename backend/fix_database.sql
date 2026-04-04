-- Run this in pgAdmin or psql to fix the missing created_at column

-- Connect to your database first:
-- psql -U postgres -d ecommerce_db

-- Add created_at column to products table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='products' AND column_name='created_at'
    ) THEN
        ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'created_at column added to products table';
    ELSE
        RAISE NOTICE 'created_at column already exists in products table';
    END IF;
END $$;

-- Add created_at column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='created_at'
    ) THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'created_at column added to users table';
    ELSE
        RAISE NOTICE 'created_at column already exists in users table';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'products')
ORDER BY table_name, ordinal_position;
