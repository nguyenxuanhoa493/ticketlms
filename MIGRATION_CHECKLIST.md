# Organizations CRM Migration Checklist

## ✅ Pre-Migration
- [ ] Backup database (nếu production)
- [ ] Review migration file: `supabase/migrations/20250206000000_organizations_crm_complete.sql`

## 🚀 Run Migration
Chọn 1 trong 2 cách:

### Option 1: Supabase Dashboard
1. [ ] Mở https://supabase.com/dashboard
2. [ ] Chọn project
3. [ ] Vào SQL Editor
4. [ ] Copy & paste nội dung file migration
5. [ ] Click Run

### Option 2: Local CLI
```bash
supabase start
supabase db reset
```

## ✅ Post-Migration Verification

### 1. Kiểm tra Tables
Vào SQL Editor chạy:
```sql
-- Check organizations table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizations';

-- Should see: status, assigned_admin_id

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'organization_%';

-- Should return:
-- organization_activities
-- organization_notes  
-- organization_todos
```

### 2. Kiểm tra Functions & Triggers
```sql
-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table LIKE 'organization%';

-- Should see triggers for:
-- - log_organization_changes on organizations
-- - log_note_changes on organization_notes
-- - log_todo_changes on organization_todos
-- - update_updated_at on all tables
```

### 3. Test Data
```sql
-- Update an organization to test auto-logging
UPDATE organizations 
SET status = 'active' 
WHERE id = (SELECT id FROM organizations LIMIT 1);

-- Check if activity was logged
SELECT * FROM organization_activities 
ORDER BY created_at DESC 
LIMIT 5;
```

## 🎯 Test Features

### Frontend Testing
1. [ ] Navigate to `/organizations`
2. [ ] Check filters work (status, search)
3. [ ] Click on an organization
4. [ ] Test all 4 tabs:
   - [ ] Overview: Edit organization info
   - [ ] Activities: See timeline
   - [ ] Notes: Add/edit/pin/delete notes
   - [ ] Todos: Add/complete/edit tasks

### Expected Results
- [ ] Status badges display correctly (active/inactive/pending)
- [ ] Assigned admin shows in list and detail
- [ ] Activities auto-log when making changes
- [ ] Notes can be pinned and edited with rich text
- [ ] Todos show priority, due date, and can be checked off

## 🐛 Troubleshooting

### Issue: Functions not found
```sql
-- Create update_updated_at_column if missing
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Issue: RLS policies blocking access
```sql
-- Check current user role
SELECT id, email, role FROM profiles WHERE id = auth.uid();

-- Must be 'admin' to access CRM features
```

### Issue: Foreign key violations
```sql
-- Check if profiles table exists and has correct columns
SELECT * FROM profiles LIMIT 1;
```

## 📝 Notes
- All CRM features are **admin-only** by RLS policies
- Activities auto-log for: create, update, status change, admin assign, notes, todos
- Notes support rich text (HTML)
- Todos have priority (low/medium/high) and status (pending/in_progress/completed/cancelled)

## 🎉 Success Criteria
- [ ] All tables created
- [ ] All triggers working
- [ ] RLS policies active
- [ ] Frontend displays all tabs
- [ ] Can CRUD notes and todos
- [ ] Activities auto-logging works
