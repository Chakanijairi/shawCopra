# Shaw's Copra Backend API

Express.js backend for the Shaw's Copra e-commerce platform (PERN Stack).

## Tech Stack

- **Node.js** + **Express.js**
- **PostgreSQL** database
- **JWT** authentication
- **Multer** for file uploads
- **bcryptjs** for password hashing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
PORT=8000
DATABASE_URL=postgresql://postgres:010100@localhost:5432/ecommerce_db
JWT_SECRET=supersecretkey123
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

3. Make sure PostgreSQL is running with database `ecommerce_db`

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### Auth
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create product (admin only)
- `PUT /products/:id` - Update product (admin only)
- `DELETE /products/:id` - Delete product (admin only)

### Health
- `GET /health` - Check server status

## Database Schema

### Users Table
- id (SERIAL PRIMARY KEY)
- full_name (VARCHAR)
- email (VARCHAR UNIQUE)
- password (VARCHAR - hashed)
- role (VARCHAR - 'user' or 'admin')
- created_at (TIMESTAMP)

### Products Table
- id (SERIAL PRIMARY KEY)
- name (VARCHAR)
- description (TEXT)
- price (DECIMAL)
- image_path (VARCHAR)
- created_at (TIMESTAMP)
