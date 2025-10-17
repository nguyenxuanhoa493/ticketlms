# 🎨 Request History - Default Collapsed

## ✅ Completed

Request History giờ sẽ **mặc định thu gọn** (collapsed) để tiết kiệm không gian, focus vào Response chính.

## 🎯 Changes

### Before: Always Expanded
```
┌─────────────────────────────────────────┐
│ Response                    [Copy]      │
├─────────────────────────────────────────┤
│                                         │
│ Request History (3)                     │ ← Always visible
│ ┌─────────────────────────────────────┐ │
│ │ 200 POST /api/search      125ms     │ │
│ │ ▼ Payload (3 params)                │ │
│ │ ▼ Response Preview                  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 200 GET /api/user         89ms      │ │
│ │ ▼ Payload (1 params)                │ │
│ │ ▼ Response Preview                  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 200 POST /api/login       234ms     │ │
│ │ ▼ Payload (2 params)                │ │
│ │ ▼ Response Preview                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ {                                       │ ← Main response
│   "success": true,                      │   far down
│   ...                                   │
│ }                                       │
└─────────────────────────────────────────┘
```

**Problems:**
- ❌ Takes too much space
- ❌ Main response pushed down
- ❌ Need to scroll to see response
- ❌ History always visible even when not needed

### After: Default Collapsed
```
┌─────────────────────────────────────────┐
│ Response                    [Copy]      │
├─────────────────────────────────────────┤
│                                         │
│ ▶ Request History (3)                   │ ← Collapsed
│                                         │
│ {                                       │ ← Main response
│   "success": true,                      │   immediately visible
│   "data": {                             │
│     "users": [...]                      │
│   }                                     │
│ }                                       │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Click to expand:**
```
┌─────────────────────────────────────────┐
│ Response                    [Copy]      │
├─────────────────────────────────────────┤
│                                         │
│ ▼ Request History (3)                   │ ← Expanded
│ ┌─────────────────────────────────────┐ │
│ │ 200 POST /api/search      125ms     │ │
│ │ ▼ Payload (3 params)                │ │
│ │ ▼ Response Preview                  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 200 GET /api/user         89ms      │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 200 POST /api/login       234ms     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ {                                       │
│   "success": true,                      │
│   ...                                   │
└─────────────────────────────────────────┘
```

## 🔧 Implementation

### 1. New State

```typescript
const [historyExpanded, setHistoryExpanded] = useState(false);
```

**Default:** `false` (collapsed)

### 2. Wrap in `<details>` Element

```tsx
<details 
    className="border rounded-lg bg-gray-50"
    open={historyExpanded}
    onToggle={(e) => setHistoryExpanded(e.currentTarget.open)}
>
    <summary className="cursor-pointer p-3 font-semibold text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center justify-between">
        <span>Request History ({requestHistory.length})</span>
        <ChevronRight className={`w-4 h-4 transition-transform ${historyExpanded ? 'rotate-90' : ''}`} />
    </summary>
    
    <div className="px-3 pb-3 space-y-3">
        {/* History items */}
    </div>
</details>
```

### 3. Animated Icon

```tsx
<ChevronRight className={`
    w-4 h-4 
    transition-transform 
    ${historyExpanded ? 'rotate-90' : ''}
`} />
```

**States:**
- Collapsed: `→` (ChevronRight, 0deg)
- Expanded: `↓` (ChevronRight, 90deg)

## 🎨 UI Components

### Summary Bar (Clickable Header)

```tsx
<summary className="cursor-pointer p-3 font-semibold text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center justify-between">
    <span>Request History ({requestHistory.length})</span>
    <ChevronRight className="w-4 h-4 transition-transform ..." />
</summary>
```

**Features:**
- Clickable entire bar
- Hover effect (gray-100 background)
- Shows count
- Animated arrow icon

### Content Container

```tsx
<div className="px-3 pb-3 space-y-3">
    {requestHistory.map((req, index) => (
        <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
            {/* Request item */}
        </div>
    ))}
</div>
```

## 🎯 User Flow

### Scenario 1: First API Call

1. User executes API call
2. Response appears
3. Request History shows: `▶ Request History (1)`
4. History is **collapsed** by default
5. Main response is immediately visible
6. User sees result without scrolling

### Scenario 2: View History

1. User wants to see previous requests
2. Clicks on `▶ Request History (3)`
3. Arrow rotates: `▶` → `↓`
4. History expands with smooth animation
5. Shows all 3 requests
6. User can review each request

### Scenario 3: Collapse Back

1. History is expanded
2. User clicks `▼ Request History (3)` again
3. Arrow rotates: `↓` → `▶`
4. History collapses
5. More space for main response

## 📊 Benefits

### 1. Space Efficiency
- **Default:** Collapsed = 1 line (~40px)
- **Before:** Expanded = ~150px per request
- **Savings:** ~450px for 3 requests

### 2. Focus on Response
- Main response immediately visible
- No scrolling needed
- Clear visual hierarchy
- Less distraction

### 3. Optional Detail
- History available when needed
- One click to expand
- Preserves all functionality
- User control

### 4. Clean UI
- Less visual clutter
- Professional appearance
- Compact design
- Better UX

## 🎨 Visual States

### Collapsed (Default)
```
┌─────────────────────────────────────┐
│ ▶ Request History (3)               │ ← 1 line only
└─────────────────────────────────────┘
```

### Hover
```
┌─────────────────────────────────────┐
│ ▶ Request History (3)      [hover]  │ ← Gray background
└─────────────────────────────────────┘
```

### Expanded
```
┌─────────────────────────────────────┐
│ ▼ Request History (3)               │
│ ┌─────────────────────────────────┐ │
│ │ Request 1                       │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Request 2                       │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Request 3                       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🔧 Technical Details

### State Management

```typescript
// Default: collapsed
const [historyExpanded, setHistoryExpanded] = useState(false);

// Track open/close
<details 
    open={historyExpanded}
    onToggle={(e) => setHistoryExpanded(e.currentTarget.open)}
>
```

### CSS Transitions

```tsx
// Icon rotation
className={`
    w-4 h-4 
    transition-transform        // Smooth animation
    ${historyExpanded ? 'rotate-90' : ''}
`}
```

### Native HTML

Uses native `<details>` and `<summary>` elements:
- Built-in expand/collapse
- Accessible (keyboard support)
- Semantic HTML
- No extra JS needed

## 📈 Comparison

### Space Usage

| State | Height | Content |
|-------|--------|---------|
| Before (always open) | ~450px | 3 requests × ~150px |
| After (collapsed) | ~40px | Just header |
| After (expanded) | ~450px | Same as before |

**Default savings:** ~410px vertical space

### Scroll Distance

| Scenario | Before | After |
|----------|--------|-------|
| See main response | Scroll 450px | 0px (visible) |
| See history | 0px (visible) | Click to expand |

### User Actions

| Task | Before | After |
|------|--------|-------|
| View response | Scroll down | No action needed |
| View history | Scroll up | Click to expand |
| Close history | N/A | Click to collapse |

## ✅ Features Preserved

### All History Features Still Work

- ✅ Shows all requests in order
- ✅ Status codes visible
- ✅ Response times shown
- ✅ Payload collapsible
- ✅ Response preview collapsible
- ✅ Monaco editor for JSON
- ✅ Full functionality

### Added Features

- ✅ Collapse/expand control
- ✅ Animated arrow icon
- ✅ Hover feedback
- ✅ Preserved state during session
- ✅ Native accessibility

## 📈 Build Impact

### Before
```
✓ /tools/api-runner  13.6 kB
```

### After
```
✓ /tools/api-runner  13.7 kB
```

**Impact:** +100 bytes (minimal)

## 🧪 Testing Checklist

### Collapse/Expand
- [ ] Default state: collapsed (▶)
- [ ] Click to expand: shows history
- [ ] Arrow rotates: ▶ → ▼
- [ ] Click to collapse: hides history
- [ ] Arrow rotates back: ▼ → ▶

### Visual
- [ ] Hover effect on header works
- [ ] Arrow animation smooth
- [ ] Border styling consistent
- [ ] Background colors correct

### Functionality
- [ ] All history items visible when expanded
- [ ] Payload/Response details still work
- [ ] Monaco editors load correctly
- [ ] No visual glitches

### Responsive
- [ ] Works on mobile
- [ ] Works on tablet
- [ ] Works on desktop
- [ ] Touch-friendly

## 🎯 Summary

### Changed
- ✅ Added `historyExpanded` state (default: false)
- ✅ Wrapped history in `<details>` element
- ✅ Added clickable summary header
- ✅ Added animated chevron icon
- ✅ Added hover effect

### Benefits
- 📐 ~410px space saved by default
- 👁️ Main response immediately visible
- 🎯 Focus on primary content
- 🎨 Cleaner UI
- ⚡ User control over detail level

### Files Changed
- `src/app/tools/api-runner/page.tsx`
  - Added `historyExpanded` state
  - Wrapped Request History in collapsible `<details>`
  - Added summary bar with animated icon

---

**Collapsed by default, expanded by choice!** 📦✨
