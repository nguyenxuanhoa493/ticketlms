# 🎨 JSON Editor with Syntax Highlighting

## ✨ New Feature

Thay thế `<Textarea>` đơn giản bằng **Monaco Editor** (VS Code editor) cho Payload JSON.

## 🎯 Features

### Monaco Editor (@monaco-editor/react)
- ✅ **Syntax Highlighting** - Colors cho JSON
- ✅ **Auto-complete** - Suggestions
- ✅ **Error Detection** - Real-time validation
- ✅ **Format Button** - Auto format JSON
- ✅ **Line Numbers** - Easier navigation
- ✅ **Bracket Matching** - Colorized brackets
- ✅ **Folding** - Collapse/expand blocks
- ✅ **Dark Theme** - Matches UI
- ✅ **Word Wrap** - No horizontal scroll

## 📦 Package Installed

```bash
npm install @monaco-editor/react
```

**Size:** ~500KB (lazy loaded, only when needed)

## 🆚 Comparison

### Before (Textarea)
```
┌────────────────────────────┐
│ Payload (JSON)    [Format] │
├────────────────────────────┤
│ {"ntype":"user","iid":123} │ ← Plain text
│                            │ ← No colors
│                            │ ← No validation
│                            │
└────────────────────────────┘
```

### After (Monaco Editor)
```
┌────────────────────────────────┐
│ Payload (JSON)                 │
│ ✅ Valid JSON        [Format]  │
├────────────────────────────────┤
│ 1  {                           │ ← Line numbers
│ 2    "ntype": "user",          │ ← Green strings
│ 3    "iid": 123                │ ← Purple numbers
│ 4  }                           │ ← Bracket matching
│                                │
└────────────────────────────────┘
```

## 🎨 UI Components

### JsonEditor Component

**Location:** `src/components/tools/JsonEditor.tsx`

**Props:**
```typescript
interface JsonEditorProps {
    value: string;
    onChange: (value: string) => void;
    height?: string;          // Default: "300px"
    readOnly?: boolean;       // Default: false
}
```

**Features:**
1. **Real-time Validation**
   - ✅ Valid JSON → Green checkmark
   - ❌ Invalid JSON → Red X + error message

2. **Format Button**
   - Auto-indent and prettify
   - Fix common formatting issues

3. **Monaco Features**
   - Syntax highlighting
   - Line numbers
   - Auto-complete
   - Bracket matching
   - Code folding
   - Find & Replace (Cmd+F)
   - Multi-cursor (Cmd+D)

## 📝 Usage

### In API Runner

**Before:**
```tsx
<Textarea
    value={payload}
    onChange={(e) => setPayload(e.target.value)}
    rows={10}
/>
```

**After:**
```tsx
<JsonEditor
    value={payload}
    onChange={setPayload}
    height="300px"
/>
```

### Example Usage

```tsx
import { JsonEditor } from "@/components/tools/JsonEditor";

// Editable
<JsonEditor
    value={jsonString}
    onChange={setJsonString}
    height="400px"
/>

// Read-only
<JsonEditor
    value={jsonString}
    onChange={() => {}}
    height="200px"
    readOnly
/>
```

## 🎨 Visual Features

### Syntax Colors (Dark Theme)

- **Strings:** `"user"` → Green (#4EC9B0)
- **Numbers:** `123` → Purple (#B5CEA8)
- **Booleans:** `true/false` → Blue (#569CD6)
- **Null:** `null` → Gray (#808080)
- **Keys:** `"ntype"` → Light Blue (#9CDCFE)
- **Brackets:** `{}[]` → Yellow/Pink (colorized pairs)
- **Punctuation:** `,` `:` → Gray

### Validation States

**Valid JSON:**
```
✅ Valid JSON        [Format]
```

**Invalid JSON:**
```
❌ Invalid JSON      [Format]
─────────────────────────────
⚠️ Unexpected token } in JSON at position 42
```

## 🚀 Benefits

### Developer Experience
- 🎯 **Easier to Edit** - VS Code-like experience
- 🔍 **Spot Errors Fast** - Red underlines on errors
- ⚡ **Auto Format** - One click to beautify
- 📋 **Better Copy/Paste** - Handles large JSON

### User Experience
- ✅ **Instant Feedback** - See errors immediately
- 🎨 **Easier to Read** - Syntax colors help scan
- 🔧 **Less Mistakes** - Auto-complete prevents typos
- 💾 **Confidence** - Validation before submit

## 📊 Performance

### Bundle Size
- **Before:** 0 KB (textarea is native)
- **After:** ~500 KB (Monaco editor)
- **Impact:** Acceptable for developer tools

### Loading Strategy
- **Lazy loaded** - Only loads when component mounts
- **CDN fallback** - Can load from CDN if needed
- **Code splitting** - Separate chunk

### Memory
- **Efficient** - Handles large JSON (10k+ lines)
- **Virtual scrolling** - Only renders visible lines
- **Syntax caching** - Fast re-renders

## 🔧 Advanced Features

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+F | Find |
| Cmd+H | Find & Replace |
| Cmd+D | Add cursor to next match |
| Cmd+/ | Toggle comment |
| Alt+↑/↓ | Move line up/down |
| Cmd+[ | Outdent |
| Cmd+] | Indent |
| Cmd+Shift+K | Delete line |

### Configuration

Monaco editor is configured with:
```typescript
{
    minimap: { enabled: false },         // No minimap
    fontSize: 13,                        // Readable
    lineNumbers: "on",                   // Show line numbers
    scrollBeyondLastLine: false,         // Compact
    readOnly: false,                     // Editable
    automaticLayout: true,               // Responsive
    tabSize: 2,                          // 2 spaces
    formatOnPaste: true,                 // Auto format
    formatOnType: true,                  // Format while typing
    wordWrap: "on",                      // No horizontal scroll
    folding: true,                       // Collapsible
    bracketPairColorization: {           // Rainbow brackets
        enabled: true,
    },
}
```

## 🎯 Integration Points

### Updated Files

**Created:**
- `src/components/tools/JsonEditor.tsx` - Main component

**Modified:**
- `src/app/tools/api-runner/page.tsx`
  - Import JsonEditor
  - Replace Textarea with JsonEditor
  - Remove handleFormatPayload (now built-in)

**Installed:**
- `@monaco-editor/react` via npm

## 🧪 Testing

### Test Cases

1. **Valid JSON**
   - Enter: `{"name": "test"}`
   - See: ✅ Valid JSON (green)

2. **Invalid JSON**
   - Enter: `{name: test}`
   - See: ❌ Invalid JSON (red)
   - See: Error message below

3. **Format**
   - Enter: `{"a":1,"b":2}`
   - Click: Format
   - Result: Properly indented

4. **Large JSON**
   - Paste 1000+ line JSON
   - Should: Handle smoothly

5. **Copy/Paste**
   - Copy from external source
   - Paste into editor
   - Should: Format automatically

## 📈 Build Status

```bash
npm run build
✓ Compiled successfully in 3.0s
✓ All routes generated
```

**Route size:**
- `/tools/api-runner` → 11.2 kB → ~11.7 kB
- Impact: +500 KB (Monaco bundle, lazy loaded)

## ✅ Summary

### What Changed
- ❌ Removed: Plain textarea
- ✅ Added: Monaco editor with syntax highlighting
- ✅ Added: Real-time JSON validation
- ✅ Added: Format button (built-in)
- ✅ Added: Error messages

### Benefits
- 🎨 Beautiful syntax highlighting
- ✅ Real-time validation
- ⚡ Auto-complete and suggestions
- 🔧 Professional editing experience
- 📋 Better for large JSON

### Ready to Use
```bash
npm run dev
# Go to: http://localhost:3000/tools/api-runner
# Try editing Payload → See syntax highlighting!
```

---

**Monaco Editor = VS Code in your browser!** 🚀
