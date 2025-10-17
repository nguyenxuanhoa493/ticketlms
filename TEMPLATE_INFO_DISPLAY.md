# 📝 Template Info Display - API Runner

## ✅ Completed

Khi load template có mô tả, hiển thị info box trên UI edit Payload JSON.

## 🎯 Feature

### Khi Load Template

**Nếu template có description:**
```
┌────────────────────────────────────────┐
│ 📄 Template Name              [Ẩn]    │
│ Mô tả chi tiết về template này...     │
│ Có thể nhiều dòng                      │
└────────────────────────────────────────┘

Payload (JSON)
┌────────────────────────────────────────┐
│ Monaco Editor...                       │
└────────────────────────────────────────┘
```

**Nếu không có description:**
- Info box không hiển thị
- Chỉ có Payload editor

## 🎨 UI Design

### Info Box Structure

```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
  [📄 Icon] [Template Name ············· [Ẩn]]
            [Description text...]
</div>
```

### Visual Elements

**Colors:**
- Background: `bg-blue-50` (light blue)
- Border: `border-blue-200` 
- Icon bg: `bg-blue-500` (blue)
- Text: `text-blue-900` (title), `text-blue-700` (description)

**Layout:**
- Icon: 20x20px blue circle with white file icon
- Title: Bold, truncate if too long
- Hide button: Top right corner
- Description: Multi-line with `whitespace-pre-wrap`

### Components

```tsx
// Icon
<div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
  <File className="w-3 h-3 text-white" />
</div>

// Title + Hide button
<div className="flex items-center justify-between gap-2">
  <p className="text-sm font-semibold text-blue-900">
    {loadedTemplateInfo.name}
  </p>
  <Button onClick={() => setLoadedTemplateInfo(null)}>
    Ẩn
  </Button>
</div>

// Description
<p className="text-xs text-blue-700 mt-1 whitespace-pre-wrap">
  {loadedTemplateInfo.description}
</p>
```

## 🔧 Implementation

### 1. New State

```typescript
const [loadedTemplateInfo, setLoadedTemplateInfo] = useState<{
  name: string;
  description: string;
} | null>(null);
```

### 2. Update handleLoadTemplate

```typescript
const handleLoadTemplate = (template: ApiRequestTemplate) => {
    // ... load all fields ...
    
    // Set template info if has description
    if (template.description) {
        setLoadedTemplateInfo({
            name: template.name,
            description: template.description
        });
    } else {
        setLoadedTemplateInfo(null);
    }
    
    setShowLoadDialog(false);
};
```

### 3. Display Info Box

```tsx
{/* Template Info */}
{loadedTemplateInfo && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
            {/* Icon */}
            <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <File className="w-3 h-3 text-white" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Title + Hide */}
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-blue-900">
                        {loadedTemplateInfo.name}
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setLoadedTemplateInfo(null)}
                    >
                        Ẩn
                    </Button>
                </div>
                
                {/* Description */}
                <p className="text-xs text-blue-700 mt-1 whitespace-pre-wrap">
                    {loadedTemplateInfo.description}
                </p>
            </div>
        </div>
    </div>
)}

{/* Payload Editor */}
<div className="space-y-2">
    <Label>Payload (JSON)</Label>
    <JsonEditor ... />
</div>
```

## 🎯 User Flow

### Scenario 1: Template with Description

1. User clicks "Load Template"
2. Selects template "Search Users"
3. Template has description: "Search for users by name or email"
4. Dialog closes
5. **Info box appears** above Payload editor
6. Info shows:
   - Icon + Template name
   - Description text
   - [Ẩn] button
7. User can click [Ẩn] to hide box

### Scenario 2: Template without Description

1. User clicks "Load Template"
2. Selects template "Get User"
3. Template has NO description
4. Dialog closes
5. **No info box** shown
6. Just Payload editor

### Scenario 3: Hide Info Box

1. Info box is showing
2. User clicks [Ẩn] button
3. Info box disappears
4. State set to null
5. More space for Payload editor

## 📊 Benefits

### User Experience
1. **Context reminder** - See what template is loaded
2. **Documentation** - Description explains purpose
3. **Optional** - Can hide if not needed
4. **Non-intrusive** - Compact design

### Developer Experience
1. **Template documentation** - Encourage writing descriptions
2. **Clear context** - Know what config is active
3. **Easy dismiss** - One click to hide

## 🎨 Visual Examples

### With Description
```
┌─────────────────────────────────────────────┐
│ Request Configuration                       │
├─────────────────────────────────────────────┤
│ [Method] [Environment]                      │
│ [Path]                                      │
│ [DMN] [User] [Password]                     │
│                                             │
│ ╔═══════════════════════════════════════╗  │
│ ║ 📄 Search Users API        [Ẩn]      ║  │ ← Info box
│ ║ Tìm kiếm user theo tên hoặc email    ║  │
│ ║ Sử dụng payload: ntype=user, text=.. ║  │
│ ╚═══════════════════════════════════════╝  │
│                                             │
│ Payload (JSON)                              │
│ ┌───────────────────────────────────────┐  │
│ │ {                                     │  │
│ │   "ntype": "user",                    │  │
│ │   "text": "john"                      │  │
│ │ }                                     │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ [Thực thi]                                  │
└─────────────────────────────────────────────┘
```

### Without Description
```
┌─────────────────────────────────────────────┐
│ Request Configuration                       │
├─────────────────────────────────────────────┤
│ [Method] [Environment]                      │
│ [Path]                                      │
│ [DMN] [User] [Password]                     │
│                                             │
│ Payload (JSON)                              │ ← No info box
│ ┌───────────────────────────────────────┐  │
│ │ {                                     │  │
│ │   "ntype": "user",                    │  │
│ │   "iid": 123                          │  │
│ │ }                                     │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ [Thực thi]                                  │
└─────────────────────────────────────────────┘
```

## 🔧 Configuration

### Info Box Visibility

**Show when:**
- ✅ Template loaded
- ✅ Template has description
- ✅ User hasn't clicked "Ẩn"

**Hide when:**
- ❌ No template loaded
- ❌ Template has no description  
- ❌ User clicked "Ẩn" button
- ❌ User loads another template without description

### State Management

```typescript
// Set info (when loading template with description)
setLoadedTemplateInfo({
    name: "Template Name",
    description: "Description text"
});

// Clear info (hide box)
setLoadedTemplateInfo(null);

// Check if should show
{loadedTemplateInfo && (
    <InfoBox />
)}
```

## 📈 Build Impact

### Before
```
✓ /tools/api-runner  13.5 kB
```

### After
```
✓ /tools/api-runner  13.6 kB
```

**Impact:** +100 bytes (minimal)

## ✅ Testing Checklist

### Load Template
- [ ] Load template with description → Info box shows
- [ ] Load template without description → No info box
- [ ] Info box shows correct name and description
- [ ] Description preserves line breaks

### Hide Button
- [ ] Click [Ẩn] → Info box disappears
- [ ] Load another template → Old info replaced
- [ ] Info box doesn't block Payload editor

### Edge Cases
- [ ] Very long description → Wraps properly
- [ ] Multi-line description → Shows all lines
- [ ] Empty description → Treated as no description
- [ ] Special characters in description → Displays correctly

## 🎯 Summary

### Added
- ✅ State for loaded template info
- ✅ Blue info box component
- ✅ Logic to set/clear info on template load
- ✅ [Ẩn] button to dismiss

### Benefits
- 📝 Context reminder for loaded template
- 📖 Shows template documentation
- 🎨 Professional info box design
- 👌 Optional - can hide if not needed

### Files Changed
- `src/app/tools/api-runner/page.tsx`
  - Added `loadedTemplateInfo` state
  - Updated `handleLoadTemplate` to set info
  - Added info box UI above Payload editor

---

**Template documentation, always visible!** 📝✨
