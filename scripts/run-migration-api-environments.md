# Run Migration: API Environments

## Option 1: Supabase Dashboard (Recommended)

1. Đi đến Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)
4. Click **New query**
5. Copy toàn bộ nội dung file `supabase/migrations/create_api_environments.sql`
6. Paste vào SQL Editor
7. Click **Run** hoặc press `Ctrl/Cmd + Enter`

## Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

## Option 3: Using psql (if you have direct DB access)

```bash
# Get connection string from Supabase Dashboard → Settings → Database
export DATABASE_URL="postgresql://..."

# Run migration
psql $DATABASE_URL < supabase/migrations/create_api_environments.sql
```

## Verify Migration

Run this query in SQL Editor to check:

```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'api_environments'
);

-- Check table structure
\d api_environments

-- Or
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'api_environments';
```

## Troubleshooting

### Error: "permission denied for schema public"
- Make sure you're using service role or have proper permissions
- Run as postgres user or with admin privileges

### Error: "relation already exists"
- Table already created, skip migration
- Or drop table first: `DROP TABLE IF EXISTS api_environments CASCADE;`

### Error: "uuid_generate_v4() does not exist"
```sql
-- Enable uuid extension first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
