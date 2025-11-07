# Debug: Tickets Not Showing in Organization Detail

## 🐛 Issues
1. ✅ API calls 2 lần (FIXED - removed `loaded` from dependencies)
2. ⚠️ Tickets tab empty (DEBUGGING)

## 🔍 Debug Steps

### Step 1: Check Console Logs

Open browser DevTools Console and look for:

```
[OrganizationTickets] API response: { data: [...], pagination: {...} }
[OrganizationTickets] Tickets count: X
[OrganizationTickets] Filtering: { totalTickets: X, statusFilter: "all", priorityFilter: "all" }
[OrganizationTickets] Filtered result: X
[OrganizationTickets] Render: { loading: false, loaded: true, totalTickets: X, filteredTickets: X, openTickets: X, closedTickets: X }
```

### Interpretation:

#### Scenario 1: No API call
```
// No logs at all
```
**Problem**: Component not mounting or `loaded` flag blocking fetch
**Fix**: Check if tab is active, verify useEffect dependencies

#### Scenario 2: API returns empty
```
[OrganizationTickets] API response: { data: [], pagination: { total: 0 } }
[OrganizationTickets] Tickets count: 0
```
**Problem**: No tickets in database for this organization
**Fix**: Create tickets with this `organization_id`

#### Scenario 3: API returns data but UI empty
```
[OrganizationTickets] API response: { data: [...], pagination: {...} }
[OrganizationTickets] Tickets count: 5
[OrganizationTickets] Filtering: { totalTickets: 5, ... }
[OrganizationTickets] Filtered result: 0  ⚠️ Problem here!
```
**Problem**: Filters removing all tickets
**Fix**: Check filter logic or default filter values

#### Scenario 4: Filtered data exists but not rendering
```
[OrganizationTickets] Render: {
  loading: false,
  loaded: true, 
  totalTickets: 5,
  filteredTickets: 5,
  openTickets: 0,   ⚠️ All tickets are closed?
  closedTickets: 5
}
```
**Problem**: All tickets have `status: 'closed'`, shown in "Đã đóng" section
**Fix**: Scroll down or create open tickets

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Click "Tickets" tab
3. Look for request: `/api/tickets?organization_id=...&limit=100`

**Expected Response**:
```json
{
  "data": [
    {
      "id": "...",
      "title": "Fix bug",
      "status": "open",
      "priority": "high",
      "organization_id": "...",
      "assigned_to": "...",
      "created_at": "...",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**If Empty**:
```json
{
  "data": [],
  "pagination": { "total": 0 }
}
```
→ No tickets for this organization in database

### Step 3: Verify Database

Run in Supabase SQL Editor:

```sql
-- Check if tickets exist for this organization
SELECT 
  id, 
  title, 
  status, 
  priority,
  organization_id,
  created_at
FROM tickets
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY created_at DESC;

-- Check tickets table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets';

-- Verify organization_id is correct
SELECT id, name FROM organizations;
```

### Step 4: Test API Directly

```bash
# In browser console or terminal
fetch('/api/tickets?organization_id=YOUR_ORG_ID&limit=100')
  .then(r => r.json())
  .then(console.log);
```

## 🛠️ Common Fixes

### Fix 1: API Called Multiple Times

**Problem**: `loaded` in useEffect dependencies causes loop

**Before** ❌:
```typescript
useEffect(() => {
    if (!loaded) fetchTickets();
}, [organizationId, loaded]); // ❌ loaded triggers re-render
```

**After** ✅:
```typescript
useEffect(() => {
    if (!loaded) fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [organizationId]); // ✅ Only organizationId
```

### Fix 2: Tickets Not in UI (But API Has Data)

**Possible Causes**:

1. **Filters Too Restrictive**
```typescript
// Check default filter values
const [statusFilter, setStatusFilter] = useState<string>("all"); // ✅
const [priorityFilter, setPriorityFilter] = useState<string>("all"); // ✅
```

2. **Wrong Status Check**
```typescript
// Check if logic is correct
const openTickets = filteredTickets.filter((t) => t.status !== "closed");

// Possible ticket status values:
// - "open"
// - "in_progress" 
// - "closed"
```

3. **Conditional Rendering Issue**
```typescript
// Check render conditions
{openTickets.length > 0 && (  // Only shows if > 0
  <div>...</div>
)}

{closedTickets.length > 0 && ( // Check this section too
  <div>...</div>
)}
```

### Fix 3: Create Test Tickets

If no tickets exist, create some:

```sql
-- Insert test ticket
INSERT INTO tickets (
  title,
  description,
  status,
  priority,
  organization_id,
  created_by
) VALUES (
  'Test Ticket 1',
  'This is a test ticket',
  'open',
  'high',
  'YOUR_ORG_ID',  -- Replace with actual org ID
  'YOUR_USER_ID'   -- Replace with actual user ID
);

-- Verify
SELECT * FROM tickets WHERE organization_id = 'YOUR_ORG_ID';
```

## 📊 Debugging Checklist

Use console logs to check each step:

- [ ] Component mounts: `console.log("[Mounted]")`
- [ ] useEffect runs: See `[OrganizationTickets] API response`
- [ ] API returns data: `Tickets count: X` (X > 0)
- [ ] Data stored in state: `totalTickets: X`
- [ ] Filtering works: `filteredTickets: X`
- [ ] Open/closed split: `openTickets: X, closedTickets: X`
- [ ] Render condition: `loading: false`
- [ ] UI shows: Check browser

## 🎯 Current Implementation

**OrganizationTickets.tsx** now has extensive logging:

```typescript
// On fetch
console.log("[OrganizationTickets] API response:", result);
console.log("[OrganizationTickets] Tickets count:", ticketsData.length);

// On filter
console.log("[OrganizationTickets] Filtering:", {
    totalTickets,
    statusFilter,
    priorityFilter,
});
console.log("[OrganizationTickets] Filtered result:", filtered.length);

// On render
console.log("[OrganizationTickets] Render:", {
    loading,
    loaded,
    totalTickets,
    filteredTickets,
    openTickets,
    closedTickets,
});
```

## 🧪 Test Steps

1. Navigate to organization detail page
2. Open Console (F12)
3. Click "Tickets" tab
4. Look for console logs
5. Compare with scenarios above
6. Apply appropriate fix

## 📝 Next Steps

Based on console output:

### If `Tickets count: 0`
→ Create tickets in database

### If `Tickets count: 5` but `filteredTickets: 0`
→ Check filter logic

### If `openTickets: 0, closedTickets: 5`
→ All tickets closed, create open ones or check "Đã đóng" section

### If everything shows in console but not UI
→ Check render conditions, component hierarchy

## ✅ Expected Behavior

After fixes:
1. Click "Tickets" tab → Fetch API **once**
2. Console shows data
3. UI displays tickets in table
4. Filters work
5. Click other tabs and back → Use cached data, **no new API call**

---

**Status**: Debugging tools added, ready to test! 🔍
