# PostgreSQL Setup Guide for Secure Share

This guide will help you set up PostgreSQL for your secure sharing application.

## Prerequisites

1. **PostgreSQL Database Server**
   - Local installation: [Download PostgreSQL](https://www.postgresql.org/download/)
   - Cloud options: Supabase, Neon, Railway, or AWS RDS

## Setup Options

### Option 1: Local PostgreSQL Installation

1. **Install PostgreSQL** (if not already installed)

   ```bash
   # Windows (using chocolatey)
   choco install postgresql

   # macOS (using homebrew)
   brew install postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Start PostgreSQL Service**

   ```bash
   # Windows
   net start postgresql-x64-15

   # macOS
   brew services start postgresql

   # Linux
   sudo systemctl start postgresql
   ```

3. **Create Database and User**

   ```bash
   # Connect to PostgreSQL as superuser
   psql -U postgres

   # In PostgreSQL shell:
   CREATE DATABASE secure_share_db;
   CREATE USER secure_share_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE secure_share_db TO secure_share_user;
   \q
   ```

### Option 2: Cloud Database (Recommended for Development)

#### Using Supabase (Free Tier)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your connection string from Settings > Database
4. Use the connection string in your `.env` file

#### Using Neon (Free Tier)

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Use it in your `.env` file

## Environment Configuration

1. **Copy the environment template**

   ```bash
   # Create .env file from the template below
   cp .env.example .env  # If you have the example file
   ```

2. **Create `.env` file** with the following content:

   ```env
   # Database - Replace with your actual connection string
   DATABASE_URL="postgresql://secure_share_user:your_secure_password@localhost:5432/secure_share_db?schema=public"

   # For cloud databases, use the provided connection string:
   # DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

   # NextAuth.js - Generate secure secrets
   NEXTAUTH_SECRET="your-nextauth-secret-here-change-this-in-production"
   NEXTAUTH_URL="http://localhost:3000"

   # Encryption for secret content - Generate with: openssl rand -hex 32
   ENCRYPTION_KEY="your-32-byte-encryption-key-here-change-this-in-production"
   ```

3. **Generate secure secrets**

   ```bash
   # Generate NextAuth secret
   openssl rand -base64 32

   # Generate encryption key
   openssl rand -hex 32
   ```

## Database Migration

1. **Run the initial migration**

   ```bash
   npx prisma migrate dev --name init
   ```

2. **Verify the migration**
   ```bash
   npx prisma studio
   ```
   This opens a web interface to view your database tables.

## Common Connection Strings

### Local PostgreSQL

```
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

### Supabase

```
DATABASE_URL="postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres?sslmode=require"
```

### Neon

```
DATABASE_URL="postgresql://username:password@ep-name.region.neon.tech/database?sslmode=require"
```

### Railway

```
DATABASE_URL="postgresql://postgres:password@containers-us-west-id.railway.app:port/railway?sslmode=require"
```

## Database Schema Overview

The schema includes the following main tables:

- **users**: User authentication and profile data
- **accounts/sessions**: NextAuth.js authentication tables
- **secrets**: Main table for shared secrets/files
- **shared_secrets**: Junction table for sharing permissions
- **access_logs**: Security logging for secret access

## Troubleshooting

### Connection Issues

1. **Check if PostgreSQL is running**

   ```bash
   # Windows
   sc query postgresql-x64-15

   # macOS/Linux
   pg_isready
   ```

2. **Verify connection string**

   ```bash
   psql "your-connection-string-here"
   ```

3. **Check firewall/network settings** for cloud databases

### Migration Issues

1. **Reset database** (development only)

   ```bash
   npx prisma migrate reset
   ```

2. **Push schema without migration**
   ```bash
   npx prisma db push
   ```

## Next Steps

1. ✅ PostgreSQL is set up
2. ✅ Database schema is created
3. ✅ Prisma client is generated
4. 🔄 Next: Set up authentication (NextAuth.js)
5. 🔄 Next: Create API routes (tRPC)
6. 🔄 Next: Build UI components

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for database users
- Enable SSL/TLS for production databases
- Regularly backup your database
- Monitor access logs for suspicious activity

## Useful Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply new migration
npx prisma migrate dev --name "description"

# View database in browser
npx prisma studio

# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```
