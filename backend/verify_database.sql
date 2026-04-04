-- Verification Script for PostgreSQL Database
-- Run this in pgAdmin Query Tool or psql

-- 1. CHECK IF TABLES EXIST
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'products')
ORDER BY table_name;

-- 2. CHECK USERS TABLE STRUCTURE
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 3. CHECK PRODUCTS TABLE STRUCTURE
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 4. CHECK IF JWT_SECRET IS BEING READ (from backend logs)
-- This will be visible in the backend terminal, not in SQL

-- 5. COUNT EXISTING USERS
SELECT COUNT(*) as total_users FROM users;

-- 6. COUNT EXISTING PRODUCTS
SELECT COUNT(*) as total_products FROM products;

-- 7. VIEW ALL USERS (without password for security)
SELECT id, full_name, email, role, created_at 
FROM users 
ORDER BY id;

-- 8. VIEW ALL PRODUCTS
SELECT * FROM products ORDER BY id;
