# PostgreSQL Setup Guide for Shaw's Copra

Complete step-by-step guide to set up and customize PostgreSQL for this PERN stack project.

---

## 📋 Prerequisites

Before starting, ensure you have:
- Windows 10/11
- Administrator access
- Internet connection

---

## 🔧 Step 1: Install PostgreSQL

### Option A: Download from Official Website

1. **Download PostgreSQL Installer**
   - Visit: https://www.postgresql.org/download/windows/
   - Click "Download the installer" (EnterpriseDB)
   - Choose the latest version (e.g., PostgreSQL 16.x)

2. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - Click "Next" through the welcome screen

3. **Choose Installation Directory**
   - Default: `C:\Program Files\PostgreSQL\16`
   - Click "Next"

4. **Select Components** (Check all):
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (GUI tool)
   - ✅ Stack Builder
   - ✅ Command Line Tools
   - Click "Next"

5. **Set Data Directory**
   - Default: `C:\Program Files\PostgreSQL\16\data`
   - Click "Next"

6. **Set Superuser Password** ⚠️ **IMPORTANT**
   - Enter a password (e.g., `010100`)
   - **Remember this password!** You'll need it later
   - Confirm password
   - Click "Next"

7. **Set Port**
   - Default: `5432`
   - Keep this unless it conflicts with another service
   - Click "Next"

8. **Set Locale**
   - Default: [Default locale]
   - Click "Next"

9. **Complete Installation**
   - Review settings
   - Click "Next" to install
   - Wait for installation (may take 5-10 minutes)
   - Click "Finish"

### Option B: Using Chocolatey (if you have it)

```powershell
choco install postgresql
```

---

## 🗄️ Step 2: Create Database

### Method 1: Using pgAdmin (GUI)

1. **Open pgAdmin 4**
   - Start Menu → PostgreSQL → pgAdmin 4
   - Set a master password (one-time setup)

2. **Connect to Server**
   - Left sidebar → Servers → PostgreSQL 16
   - Enter your superuser password (from Step 1.6)

3. **Create Database**
   - Right-click "Databases" → Create → Database
   - **Database name**: `ecommerce_db`
   - **Owner**: `postgres`
   - Click "Save"

4. **Verify Database**
   - You should see `ecommerce_db` in the database list

### Method 2: Using Command Line (psql)

1. **Open Command Prompt as Administrator**
   - Press `Win + X` → "Terminal (Admin)"

2. **Navigate to PostgreSQL bin folder**
   ```powershell
   cd "C:\Program Files\PostgreSQL\16\bin"
   ```

3. **Connect to PostgreSQL**
   ```powershell
   psql -U postgres
   ```
   - Enter your superuser password when prompted

4. **Create Database**
   ```sql
   CREATE DATABASE ecommerce_db;
   ```

5. **Verify Database**
   ```sql
   \l
   ```
   - You should see `ecommerce_db` in the list

6. **Exit psql**
   ```sql
   \q
   ```

---

## ⚙️ Step 3: Configure Database Connection

### Update `.env` File

1. **Open** `backend/.env` in your editor

2. **Update the DATABASE_URL** with your credentials:

   ```env
   PORT=8000
   DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
   JWT_SECRET=supersecretkey123
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

3. **Replace placeholders**:
   
   **Format:**
   ```
   postgresql://username:password@host:port/database
   ```

   **Example with default values:**
   ```
   DATABASE_URL=postgresql://postgres:010100@localhost:5432/ecommerce_db
   ```

   - `postgres` = username (default superuser)
   - `010100` = your password (from Step 1.6)
   - `localhost` = server host (local machine)
   - `5432` = PostgreSQL port (default)
   - `ecommerce_db` = database name (from Step 2)

4. **Save the file**

---

## 🎨 Step 4: Customize Database Schema (Optional)

The backend automatically creates these tables when you start the server:
- `users` - Stores user accounts (customers & admins)
- `products` - Stores product catalog

### Current Schema:

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Products Table
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### How to Customize:

#### Option 1: Modify Schema in Code (Recommended)

Edit `backend/src/config/database.js` to add/modify tables:

```javascript
const initDatabase = async () => {
  try {
    // Add your custom table here
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};
```

#### Option 2: Run SQL Commands Directly

Using pgAdmin or psql, you can run custom SQL:

**Add a new column to products:**
```sql
ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
```

**Add a new table:**
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Add a relationship:**
```sql
ALTER TABLE products 
ADD COLUMN category_id INTEGER REFERENCES categories(id);
```

---

## ✅ Step 5: Test Connection

### Method 1: Using the Backend Server

1. **Start your backend server:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Look for these success messages:**
   ```
   ✅ Connected to PostgreSQL database
   ✅ Database tables initialized
   🚀 Server running on http://localhost:8000
   ```

3. **Test the health endpoint:**
   - Open browser: http://localhost:8000/health
   - Should return: `{"status":"ok","message":"Server is running"}`

### Method 2: Using psql

1. **Connect to your database:**
   ```powershell
   psql -U postgres -d ecommerce_db
   ```

2. **List all tables:**
   ```sql
   \dt
   ```
   - Should show: `users`, `products`

3. **View table structure:**
   ```sql
   \d users
   \d products
   ```

4. **Exit:**
   ```sql
   \q
   ```

---

## 🔐 Step 6: Create Admin User (Optional)

You can create an admin user in two ways:

### Method 1: Using Frontend Registration
1. Go to http://localhost:5173/register
2. Fill in the form
3. Select "Admin" role
4. Click "Register"

### Method 2: Using SQL Directly (for testing)

```sql
-- Connect to database
psql -U postgres -d ecommerce_db

-- Insert admin user (password: admin123)
INSERT INTO users (full_name, email, password, role) 
VALUES (
  'Admin User',
  'admin@shawscopra.com',
  '$2a$10$YourHashedPasswordHere',
  'admin'
);
```

**Note:** For Method 2, you'll need to hash the password using bcrypt first.

---

## 🎯 Common Customizations

### 1. Change Database Name

If you want a different database name:

```sql
-- In psql
CREATE DATABASE my_custom_db;
```

Then update `.env`:
```env
DATABASE_URL=postgresql://postgres:010100@localhost:5432/my_custom_db
```

### 2. Create a Dedicated User (More Secure)

Instead of using the `postgres` superuser:

```sql
-- Create new user
CREATE USER shaws_copra_user WITH PASSWORD 'secure_password123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO shaws_copra_user;
```

Update `.env`:
```env
DATABASE_URL=postgresql://shaws_copra_user:secure_password123@localhost:5432/ecommerce_db
```

### 3. Add Sample Products

```sql
INSERT INTO products (name, description, price) VALUES
('Sun-Dried Copra', 'Premium quality sun-dried copra from local farms', 65.00),
('Virgin Coconut Oil', 'Cold-pressed virgin coconut oil', 420.00),
('Coconut Shell Charcoal', 'Natural coconut shell charcoal briquettes', 280.00);
```

### 4. Enable Remote Connections (if needed)

Edit `postgresql.conf`:
```
listen_addresses = '*'
```

Edit `pg_hba.conf`:
```
host    all             all             0.0.0.0/0            md5
```

**⚠️ Security Warning:** Only do this if you need remote access and understand the security implications.

---

## 🐛 Troubleshooting

### Issue 1: "Connection Refused"

**Problem:** Backend can't connect to PostgreSQL

**Solutions:**
1. Check if PostgreSQL is running:
   ```powershell
   # Open Services (Win + R → services.msc)
   # Look for "postgresql-x64-16" → Status should be "Running"
   ```

2. Verify connection string in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ecommerce_db
   ```

3. Test connection manually:
   ```powershell
   psql -U postgres -d ecommerce_db
   ```

### Issue 2: "Database does not exist"

**Solution:** Create the database:
```sql
psql -U postgres
CREATE DATABASE ecommerce_db;
\q
```

### Issue 3: "Password authentication failed"

**Solutions:**
1. Reset postgres password:
   ```powershell
   # Find pg_hba.conf (usually in C:\Program Files\PostgreSQL\16\data)
   # Change 'md5' to 'trust' temporarily
   # Restart PostgreSQL service
   # Connect: psql -U postgres
   # Reset: ALTER USER postgres PASSWORD 'new_password';
   # Change 'trust' back to 'md5'
   # Restart PostgreSQL service
   ```

### Issue 4: Port 5432 already in use

**Solution:** Either:
1. Stop the conflicting service, OR
2. Change PostgreSQL port:
   - Edit `postgresql.conf`
   - Change `port = 5432` to `port = 5433`
   - Update `.env` accordingly
   - Restart PostgreSQL

---

## 📊 Useful PostgreSQL Commands

```sql
-- List all databases
\l

-- Connect to a database
\c ecommerce_db

-- List all tables
\dt

-- Describe table structure
\d users
\d products

-- View table contents
SELECT * FROM users;
SELECT * FROM products;

-- Count records
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;

-- Delete all records (careful!)
TRUNCATE TABLE products CASCADE;

-- Drop table (careful!)
DROP TABLE products;

-- Backup database (in cmd/powershell, not psql)
pg_dump -U postgres ecommerce_db > backup.sql

-- Restore database
psql -U postgres ecommerce_db < backup.sql
```

---

## 🔗 Additional Resources

- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **pgAdmin Documentation:** https://www.pgadmin.org/docs/
- **Node.js pg module:** https://node-postgres.com/
- **SQL Tutorial:** https://www.postgresqltutorial.com/

---

## ✅ Checklist

- [ ] PostgreSQL installed
- [ ] Database `ecommerce_db` created
- [ ] `.env` configured with correct credentials
- [ ] Backend server connects successfully
- [ ] Tables created automatically (users, products)
- [ ] Admin user created (optional)
- [ ] Sample products added (optional)

---

**Need Help?** Check the troubleshooting section above or the PostgreSQL logs:
- Windows: `C:\Program Files\PostgreSQL\16\data\log\`
